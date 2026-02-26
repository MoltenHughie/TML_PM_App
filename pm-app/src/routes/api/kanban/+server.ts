import { asc } from 'drizzle-orm';
import { json } from '@sveltejs/kit';

import { db, kanbanCards, kanbanColumns } from '$lib/server/db';
import { requireAppAuth } from '$lib/server/auth';

function parseCard(row: typeof kanbanCards.$inferSelect) {
  let tags: string[] = [];
  try {
    tags = row.tags ? JSON.parse(row.tags) : [];
  } catch {
    tags = [];
  }
  return { ...row, tags };
}

export async function GET(event) {
  const auth = requireAppAuth(event);
  if (!auth.ok) {
    return auth.response;
  }

  const columns = db.select().from(kanbanColumns).orderBy(asc(kanbanColumns.position)).all();
  const cards = db.select().from(kanbanCards).orderBy(asc(kanbanCards.position)).all();

  const columnsWithCards = columns.map((col) => ({
    ...col,
    cards: cards.filter((card) => card.columnId === col.id).map(parseCard)
  }));

  return json(
    { columns: columnsWithCards },
    {
      headers: {
        'cache-control': 'no-store'
      }
    }
  );
}
