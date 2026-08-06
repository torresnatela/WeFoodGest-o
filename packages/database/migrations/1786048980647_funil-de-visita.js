exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = (pgm) => {
  // As três perguntas do balcão: entrou, viu os produtos, comprou. São a única
  // coisa que o atendente sempre sabe — ele viu a pessoa. Todo o resto (quem
  // era, por que veio, o que pediu) depende de a pessoa querer responder, e é
  // por isso que só estas três são obrigatórias.
  pgm.addColumns("visits", {
    entered_store: {
      type: "boolean",
      notNull: true,
      default: true,
    },
    saw_products: {
      type: "boolean",
      notNull: true,
      default: true,
    },
    purchased: {
      type: "boolean",
      notNull: true,
      default: true,
    },
  });

  // O default existe só para preencher as visitas já gravadas: até aqui toda
  // visita exigia ao menos uma categoria de pedido, então `true` nas três é a
  // leitura correta do passado. Agora ele sai — visita nova responde o funil
  // explicitamente, e um insert que esquecer uma resposta tem de falhar alto
  // em vez de gravar em silêncio que a pessoa entrou, viu e comprou.
  pgm.alterColumn("visits", "entered_store", { default: null });
  pgm.alterColumn("visits", "saw_products", { default: null });
  pgm.alterColumn("visits", "purchased", { default: null });

  // Quem comprou necessariamente viu o que estava comprando.
  //
  // Não existe CHECK equivalente ligando entered_store aos outros dois de
  // propósito: quem olha a vitrine da calçada viu os produtos sem entrar, e
  // esse é justamente um dos casos que o funil precisa medir.
  pgm.addConstraint("visits", "visits_purchase_implies_seen_check", {
    check: "saw_products OR NOT purchased",
  });

  // Sem compra não há dinheiro. Impede que uma visita marcada como não-compra
  // carregue faturamento e desminta o próprio funil no dashboard.
  pgm.addConstraint("visits", "visits_amount_requires_purchase_check", {
    check: "purchased OR amount_spent = 0",
  });

  // Tudo o que dependia de a pessoa colaborar deixa de ser obrigatório. Os
  // CHECK de lista fechada de reason e discovery_source continuam valendo sem
  // alteração: `NULL IN (...)` avalia para NULL, e um CHECK só reprova em
  // FALSE — aceitar nulo sai de graça ao remover o NOT NULL.
  pgm.alterColumn("visits", "client_id", { notNull: false });
  pgm.alterColumn("visits", "reason", { notNull: false });
  pgm.alterColumn("visits", "discovery_source", { notNull: false });

  // Apagar um contato passa a anonimizar as visitas dele em vez de destruir o
  // faturamento daqueles dias junto. Só é possível agora que client_id aceita
  // nulo. Não corrige bug nenhum em produção (não existe rota de exclusão de
  // cliente), é correção de semântica que custa duas linhas.
  pgm.dropConstraint("visits", "visits_client_id_fkey");
  pgm.addConstraint("visits", "visits_client_id_fkey", {
    foreignKeys: {
      columns: "client_id",
      references: "clients(id)",
      onDelete: "SET NULL",
    },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.down = (pgm) => {
  pgm.dropConstraint("visits", "visits_client_id_fkey");
  pgm.addConstraint("visits", "visits_client_id_fkey", {
    foreignKeys: {
      columns: "client_id",
      references: "clients(id)",
      onDelete: "CASCADE",
    },
  });

  // Restaurar os NOT NULL falha se já houver visita anônima ou sem motivo
  // gravada. É o comportamento certo: reverter destruiria dados, e é melhor a
  // migration parar do que apagá-los para caber no schema antigo.
  pgm.alterColumn("visits", "client_id", { notNull: true });
  pgm.alterColumn("visits", "reason", { notNull: true });
  pgm.alterColumn("visits", "discovery_source", { notNull: true });

  pgm.dropConstraint("visits", "visits_amount_requires_purchase_check");
  pgm.dropConstraint("visits", "visits_purchase_implies_seen_check");

  pgm.dropColumns("visits", ["entered_store", "saw_products", "purchased"]);
};
