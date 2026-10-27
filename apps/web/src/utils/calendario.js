export const HORA_INICIO = 7;
export const HORA_FIM = 23;
export const ALTURA_HORA = 56;
export const MARGEM_TOPO = 16;
const ALTURA_MINIMA = 36;
export const CORES_EVENTO = {
	vermelho: 'bg-sptrans',
	verde: 'bg-green-700',
	laranja: 'bg-amber-700',
	azul: 'bg-blue-700',
	roxo: 'bg-purple-700',
	rosa: 'bg-pink-500',
	turquesa: 'bg-teal-700',
	cinza: 'bg-slate-700',
};

// Datas

export function inicioDaSemana(data) {
	return new Date(
		data.getFullYear(),
		data.getMonth(),
		data.getDate() - data.getDay()
	);
}

export function adicionarDias(data, dias) {
	return new Date(data.getFullYear(), data.getMonth(), data.getDate() + dias);
}

export function diasDaSemana(inicio) {
	return Array.from({ length: 7 }, (_, i) => adicionarDias(inicio, i));
}

export function mesmoDia(a, b) {
	return (
		a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate()
	);
}

//Textos
const capitalizar = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

export const nomeDoMes = (data) =>
	data.toLocaleDateString('pt-BR', { month: 'long' }).toUpperCase();

export const siglaDiaSemana = (data) =>
	data.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase();

export const dataPorExtenso = (data) =>
	capitalizar(
		data.toLocaleDateString('pt-BR', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
		})
	);

export const horaCurta = (data) =>
	data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

// Eventos

export function prepararEventos(eventos) {
	return eventos.map((evento) => ({
		...evento,
		inicio: new Date(evento.inicio),
		fim: new Date(evento.fim),
	}));
}

export function eventosDoDia(eventos, dia) {
	return eventos
		.filter((evento) => mesmoDia(evento.inicio, dia))
		.sort((a, b) => a.inicio - b.inicio);
}

export function posicaoVertical(evento) {
	const minutosDesdeInicio =
		(evento.inicio.getHours() - HORA_INICIO) * 60 + evento.inicio.getMinutes();
	const duracaoEmMinutos = (evento.fim - evento.inicio) / 60000;

	return {
		top: MARGEM_TOPO + Math.max(0, (minutosDesdeInicio / 60) * ALTURA_HORA),
		height: Math.max((duracaoEmMinutos / 60) * ALTURA_HORA, ALTURA_MINIMA),
	};
}

export function distribuirColunas(eventosOrdenados) {
	const resultado = [];
	let grupo = [];
	let fimDoGrupo = null;

	const fecharGrupo = () => {
		const fimPorColuna = [];
		const posicionados = grupo.map((evento) => {
			let coluna = fimPorColuna.findIndex((fim) => fim <= evento.inicio);
			if (coluna === -1) coluna = fimPorColuna.length;
			fimPorColuna[coluna] = evento.fim;
			return { evento, coluna };
		});

		posicionados.forEach(({ evento, coluna }) =>
			resultado.push({ evento, coluna, totalColunas: fimPorColuna.length })
		);
		grupo = [];
	};

	for (const evento of eventosOrdenados) {
		if (grupo.length > 0 && evento.inicio >= fimDoGrupo) fecharGrupo();

		fimDoGrupo =
			grupo.length === 0
				? evento.fim
				: new Date(Math.max(fimDoGrupo, evento.fim));
		grupo.push(evento);
	}
	if (grupo.length > 0) fecharGrupo();

	return resultado;
}

// Calendário mensal

export const primeiroDiaDoMes = (data) =>
	new Date(data.getFullYear(), data.getMonth(), 1);

export const mesDaSemana = (inicioSemana) =>
	primeiroDiaDoMes(adicionarDias(inicioSemana, 3));

export function diasDoMes(mes) {
	const inicio = inicioDaSemana(primeiroDiaDoMes(mes));
	return Array.from({ length: 42 }, (_, i) => adicionarDias(inicio, i));
}

export const mesExtenso = (data) =>
	capitalizar(
		data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
	);

export const dataLonga = (data) =>
	data.toLocaleDateString('pt-BR', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	});

export const chaveDoDia = (data) =>
	`${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;

export function coresPorDia(eventos) {
	const mapa = new Map();
	for (const evento of eventos) {
		const chave = chaveDoDia(evento.inicio);
		const cores = mapa.get(chave) ?? [];
		if (!cores.includes(evento.cor)) cores.push(evento.cor);
		mapa.set(chave, cores);
	}
	return mapa;
}
