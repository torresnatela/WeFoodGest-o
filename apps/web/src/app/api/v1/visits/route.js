import createVisit from "./create-visit";

export async function POST(request) {
  return await createVisit(request);
}
