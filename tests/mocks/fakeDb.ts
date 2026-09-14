/**
 * Doble generico de `db` (drizzle) para tests. Los controllers de este
 * repo solo hacen dos formas de query: cadenas `select().from()...` que
 * terminan en `.all()` o se awaitan directo, y `insert().values().returning()`.
 * Drizzle's query builders son "thenables" (resuelven al awaitarlos
 * directamente, sin necesitar `.all()`) - este doble imita esa forma sin
 * tener que re-implementar cada metodo real: cualquier propiedad
 * encadenada devuelve otro eslabon encadenable, y `await` en cualquier
 * punto de la cadena resuelve al resultado que el test haya configurado
 * con `setFakeDbResult`.
 *
 * Por que un mock y no golpear Turso real en los tests: los tests de
 * `POST /comments` insertarian filas reales en la base de produccion en
 * cada corrida (incluyendo cada `pre-push`) - inaceptable. Ver
 * docs/00-auditoria.md, seccion de testing.
 */

// biome-ignore lint/suspicious/noExplicitAny: doble generico deliberado, ver comentario del modulo
type Chainable = any;

const state: { current: unknown } = { current: [] };

export const setFakeDbResult = (value: unknown): void => {
	state.current = value;
};

const chainable = (): Chainable => {
	const target = (..._args: unknown[]) => chainable();
	return new Proxy(target, {
		get(_t, prop) {
			if (prop === "then") {
				return (resolve: (v: unknown) => void) => resolve(state.current);
			}
			return () => chainable();
		},
	});
};

export const fakeDb = {
	select: (..._args: unknown[]) => chainable(),
	insert: (..._args: unknown[]) => chainable(),
};
