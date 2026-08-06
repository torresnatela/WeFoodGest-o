import createVisit from "../../../visits/create-visit";

export async function POST(request, { params }) {
  const { id } = await params;

  return await createVisit(request, { clientId: id });
}
