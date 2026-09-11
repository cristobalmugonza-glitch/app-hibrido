import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PORQUES, PORQUES_LISTA } from './porques';
import { REF_POR_ID, REFERENCIAS } from './referencias';
import { REGLAS_TIPO } from './reglas-tipo';

const SRC = join(__dirname, '..');

function archivos(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return archivos(p);
    return /\.(ts|tsx)$/.test(f) && !f.endsWith('.test.ts') ? [p] : [];
  });
}

describe('reglas anti-invención', () => {
  it('toda referencia tiene autores, año, título, revista y DOI (o es el informe Navy)', () => {
    for (const r of REFERENCIAS) {
      expect(r.autores, r.id).not.toBe('');
      expect(r.titulo, r.id).not.toBe('');
      expect(r.revista, r.id).not.toBe('');
      expect(r.anio, r.id).toBeGreaterThan(1980);
      if (r.id === 'hodgdon1984') {
        expect(r.url).toContain('apps.dtic.mil');
      } else {
        expect(r.doi, r.id).toMatch(/^10\.\d{4,9}\/\S+$/);
        expect(r.url).toBe(`https://doi.org/${r.doi}`);
      }
    }
  });

  it('los ids de referencias no se repiten', () => {
    expect(new Set(REFERENCIAS.map((r) => r.id)).size).toBe(REFERENCIAS.length);
  });

  it('cada "por qué" cita referencias que existen', () => {
    for (const p of PORQUES_LISTA) for (const id of p.refs) expect(REF_POR_ID[id], `${p.id} → ${id}`).toBeDefined();
  });

  it('un "por qué" sin referencias debe declarar "evidencia limitada"', () => {
    for (const p of PORQUES_LISTA.filter((x) => x.refs.length === 0)) expect(p.etiqueta, p.id).toBe('limitada');
  });

  it('cada "por qué" explica en 1 a 4 párrafos', () => {
    for (const p of PORQUES_LISTA) {
      expect(p.texto.length, p.id).toBeGreaterThanOrEqual(1);
      expect(p.texto.length, p.id).toBeLessThanOrEqual(4);
    }
  });

  it('las referencias en disputa aparecen en algún "por qué" o se pueden filtrar', () => {
    expect(REFERENCIAS.filter((r) => r.enDisputa).map((r) => r.id)).toEqual(expect.arrayContaining(['gabbett2016', 'impellizzeri2020']));
  });

  it('todo id de "por qué" usado en el código existe', () => {
    const usados = new Set<string>();
    for (const f of archivos(SRC)) {
      const txt = readFileSync(f, 'utf8');
      for (const m of txt.matchAll(/porQue(?:Descanso)?[:=]\s*['"]([a-z0-9_]+)['"]/g)) usados.add(m[1]);
      for (const m of txt.matchAll(/<PorQue\s+id=["']([a-z0-9_]+)["']/g)) usados.add(m[1]);
    }
    for (const r of Object.values(REGLAS_TIPO)) usados.add(r.porQueDescanso);
    expect(usados.size).toBeGreaterThan(20);
    for (const id of usados) expect(PORQUES[id], id).toBeDefined();
  });
});
