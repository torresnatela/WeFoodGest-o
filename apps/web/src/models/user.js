const database = require("@wefood/database");
const { ValidationError, NotFoundError } = require("@/infra/errors");
const password = require("./password");
const role = require("./role");
const invite = require("./invite");

const UNIQUE_VIOLATION = "23505";

async function create({ name, email, password: plainTextPassword, role: roleKey = "colaborador" }) {
  const foundRole = await role.findByKey(roleKey);
  if (!foundRole) {
    throw new NotFoundError({
      message: "A role informada não foi encontrada.",
      action: "Utilize uma role existente.",
    });
  }

  const hashedPassword = await password.hash(plainTextPassword);

  try {
    const result = await database.query({
      text: `
        INSERT INTO users (name, email, password, role_id, status)
        VALUES ($1, $2, $3, $4, 'active')
        RETURNING id, name, email, password, status, created_at, updated_at;
      `,
      values: [name, email, hashedPassword, foundRole.id],
    });

    return result.rows[0];
  } catch (error) {
    if (error.code === UNIQUE_VIOLATION) {
      throw new ValidationError({
        message: "O email informado já está sendo usado.",
        action: "Utilize outro email para realizar o cadastro.",
      });
    }

    throw error;
  }
}

async function createInvite({ name, email, roleKey, invitedBy }) {
  const foundRole = await role.findByKey(roleKey);
  if (!foundRole) {
    throw new NotFoundError({
      message: "A role informada não foi encontrada.",
      action: "Utilize uma role existente.",
    });
  }

  const rawInviteToken = invite.generateToken();
  const hashedInviteToken = invite.hashToken(rawInviteToken);
  const inviteTokenExpiresAt = invite.getExpiresAt();

  try {
    const result = await database.query({
      text: `
        INSERT INTO users (name, email, role_id, status, invite_token, invite_token_expires_at, invited_by)
        VALUES ($1, $2, $3, 'pending', $4, $5, $6)
        RETURNING id, name, email, status, role_id, invite_token_expires_at, invited_by, created_at, updated_at;
      `,
      values: [name, email, foundRole.id, hashedInviteToken, inviteTokenExpiresAt, invitedBy],
    });

    return { user: result.rows[0], inviteToken: rawInviteToken };
  } catch (error) {
    if (error.code === UNIQUE_VIOLATION) {
      throw new ValidationError({
        message: "O email informado já está sendo usado.",
        action: "Utilize outro email para realizar o cadastro.",
      });
    }

    throw error;
  }
}

async function findByValidInviteToken(rawInviteToken) {
  const hashedInviteToken = invite.hashToken(rawInviteToken);

  const result = await database.query({
    text: `
      SELECT users.id, users.name, users.email, users.status,
             roles.key AS role_key, roles.name AS role_name
      FROM users
      INNER JOIN roles ON roles.id = users.role_id
      WHERE users.invite_token = $1
        AND users.status = 'pending'
        AND users.invite_token_expires_at > now();
    `,
    values: [hashedInviteToken],
  });

  const foundUser = result.rows[0];
  if (!foundUser) {
    return null;
  }

  return {
    id: foundUser.id,
    name: foundUser.name,
    email: foundUser.email,
    status: foundUser.status,
    role: { key: foundUser.role_key, name: foundUser.role_name },
  };
}

async function activateByInviteToken(rawInviteToken, plainTextPassword) {
  const invitedUser = await findByValidInviteToken(rawInviteToken);
  if (!invitedUser) {
    throw new NotFoundError({
      message: "Convite inválido, expirado ou já utilizado.",
      action: "Solicite um novo link de convite a um administrador.",
    });
  }

  const hashedPassword = await password.hash(plainTextPassword);

  const result = await database.query({
    text: `
      UPDATE users
      SET password = $1, status = 'active', invite_token = NULL, invite_token_expires_at = NULL
      WHERE id = $2
      RETURNING id, name, email, status, created_at, updated_at;
    `,
    values: [hashedPassword, invitedUser.id],
  });

  return result.rows[0];
}

async function findAll() {
  const result = await database.query(`
    SELECT users.id, users.name, users.email, users.status, users.created_at,
           roles.key AS role_key, roles.name AS role_name
    FROM users
    INNER JOIN roles ON roles.id = users.role_id
    ORDER BY users.created_at DESC;
  `);

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    status: row.status,
    created_at: row.created_at,
    role: { key: row.role_key, name: row.role_name },
  }));
}

async function findByEmail(email) {
  const result = await database.query({
    text: `
      SELECT id, email, password, created_at, updated_at
      FROM users
      WHERE email = $1;
    `,
    values: [email],
  });

  return result.rows[0] ?? null;
}

async function findById(id) {
  const result = await database.query({
    text: `
      SELECT users.id, users.name, users.email, users.password, users.status,
             users.created_at, users.updated_at,
             roles.key AS role_key, roles.name AS role_name, roles.is_super,
             COALESCE(
               array_agg(features.key) FILTER (WHERE features.key IS NOT NULL),
               '{}'
             ) AS features
      FROM users
      INNER JOIN roles ON roles.id = users.role_id
      LEFT JOIN role_features ON role_features.role_id = roles.id
      LEFT JOIN features ON features.id = role_features.feature_id
      WHERE users.id = $1
      GROUP BY users.id, roles.id;
    `,
    values: [id],
  });

  const foundUser = result.rows[0];
  if (!foundUser) {
    return null;
  }

  return {
    id: foundUser.id,
    name: foundUser.name,
    email: foundUser.email,
    password: foundUser.password,
    status: foundUser.status,
    created_at: foundUser.created_at,
    updated_at: foundUser.updated_at,
    role: { key: foundUser.role_key, name: foundUser.role_name, is_super: foundUser.is_super },
    features: foundUser.features,
  };
}

module.exports = {
  create,
  createInvite,
  findAll,
  findByEmail,
  findById,
  findByValidInviteToken,
  activateByInviteToken,
};
