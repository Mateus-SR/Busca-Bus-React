export function hora(iso) {
	return iso ? new Date(iso).toLocaleTimeString('pt-BR') : null;
}

// Só a hora quando é de hoje; com a data quando a exibição está aberta há dias.
export function horaCompleta(iso) {
	if (!iso) return null;
	const data = new Date(iso);
	return data.toDateString() === new Date().toDateString()
		? data.toLocaleTimeString('pt-BR')
		: data.toLocaleString('pt-BR');
}

const UNIDADES_BYTES = { KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3 };

export function formatarBytes(valor, unidade = 'auto') {
	if (valor == null) return null;
	if (unidade === 'auto') {
		if (valor < 1024) return `${valor} B`;
		return `${(valor / 1024).toFixed(1)} KB`;
	}
	const casas = unidade === 'GB' ? 6 : unidade === 'MB' ? 3 : 1;
	return `${(valor / UNIDADES_BYTES[unidade]).toFixed(casas)} ${unidade}`;
}
