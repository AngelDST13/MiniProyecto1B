// Muestra el texto del asistente con un formato mínimo (listas, **negritas** y `código`).
// Se arma con elementos de React: nunca se inyecta HTML, así que no hay riesgo de XSS.

const enLinea = (texto) =>
  texto.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((parte, i) => {
    if (parte.startsWith('**') && parte.endsWith('**')) return <strong key={i} className="font-semibold text-ink">{parte.slice(2, -2)}</strong>;
    if (parte.startsWith('`') && parte.endsWith('`')) return <code key={i} className="rounded bg-paper-deep px-1 font-mono text-[0.85em]">{parte.slice(1, -1)}</code>;
    return parte;
  });

// Agrupa las líneas en párrafos y listas.
const agrupar = (texto) => {
  const bloques = [];
  for (const linea of texto.split('\n')) {
    const vineta = /^\s*[-*•]\s+(.*)/.exec(linea);
    const numero = /^\s*\d+[.)]\s+(.*)/.exec(linea);
    const tipo = vineta ? 'ul' : numero ? 'ol' : linea.trim() ? 'p' : null;
    const contenido = (vineta ?? numero)?.[1] ?? linea.trim();
    const ultimo = bloques.at(-1);
    if (!tipo) bloques.push({ tipo: 'espacio' });
    else if (tipo !== 'p' && ultimo?.tipo === tipo) ultimo.items.push(contenido);
    else if (tipo === 'p' && ultimo?.tipo === 'p') ultimo.items.push(contenido);
    else bloques.push({ tipo, items: [contenido] });
  }
  return bloques.filter((b) => b.tipo !== 'espacio');
};

export const TextoEnriquecido = ({ texto }) => (
  <div className="space-y-2">
    {agrupar(texto).map((bloque, i) => {
      if (bloque.tipo === 'p') return <p key={i}>{bloque.items.map((l, j) => <span key={j} className="block">{enLinea(l)}</span>)}</p>;
      const Lista = bloque.tipo;
      return (
        <Lista key={i} className={`space-y-1 pl-5 ${Lista === 'ul' ? 'list-disc' : 'list-decimal'} marker:text-muted`}>
          {bloque.items.map((item, j) => <li key={j}>{enLinea(item)}</li>)}
        </Lista>
      );
    })}
  </div>
);
