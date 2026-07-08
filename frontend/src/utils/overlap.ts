/**
 * Раскладка пересекающихся интервалов по колонкам.
 * Элементы группируются в кластеры пересечения; внутри кластера каждому
 * назначается колонка (col) и общее число колонок кластера (cols),
 * чтобы карточки рисовались рядом, а не друг на друге.
 */
export function assignColumns<T extends { top: number; bottom: number }>(
  items: T[],
): (T & { col: number; cols: number })[] {
  const sorted = [...items].sort((a, b) => a.top - b.top || b.bottom - a.bottom);

  const result: (T & { col: number; cols: number })[] = [];
  let cluster: T[] = [];
  let clusterEnd = -Infinity;

  const flushCluster = () => {
    if (cluster.length === 0) return;
    const colEnds: number[] = [];
    const placed = cluster.map((m) => {
      let col = colEnds.findIndex((end) => end <= m.top);
      if (col === -1) {
        col = colEnds.length;
        colEnds.push(m.bottom);
      } else {
        colEnds[col] = m.bottom;
      }
      return { ...m, col, cols: 1 };
    });
    placed.forEach((p) => {
      p.cols = colEnds.length;
      result.push(p);
    });
    cluster = [];
  };

  for (const m of sorted) {
    if (cluster.length > 0 && m.top >= clusterEnd) flushCluster();
    cluster.push(m);
    clusterEnd = Math.max(clusterEnd, m.bottom);
  }
  flushCluster();

  return result;
}
