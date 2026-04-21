/**
 * Funções CRUD para Reservas
 */

const API_URL = '/api/reservas';
const API_SALAS = '/api/salas';

/**
 * Exibe toast de feedback
 */
function mostrarToastReserva(mensagem, tipo = 'success') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-message');
    if (!toast) {
        alert(mensagem);
        return;
    }
    
    toast.className = `fixed bottom-8 right-8 z-[100] ${tipo === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white px-6 py-4 rounded-xl shadow-xl flex items-center gap-3`;
    toastMsg.textContent = mensagem;
    toast.classList.remove('hidden');
    
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

/**
 * Listar reservas da API
 */
async function listarReservas(filtros = {}) {
    try {
        const url = new URL(API_URL, window.location.origin);
        Object.keys(filtros).forEach(k => url.searchParams.append(k, filtros[k]));
        const response = await fetch(url);
        if (!response.ok) throw new Error('Erro ao buscar reservas');
        return await response.json();
    } catch (error) {
        console.error('Erro:', error);
        return [];
    }
}

/**
 * Listar salas para o select
 */
async function listarSalas() {
    try {
        const response = await fetch(API_SALAS);
        if (!response.ok) throw new Error('Erro ao buscar salas');
        return await response.json();
    } catch (error) {
        console.error('Erro:', error);
        return [];
    }
}

/**
 * Abrir modal para nova reserva
 */
async function abrirModalNovaReserva() {
    document.getElementById('reservaModalTitle').textContent = 'Nova Reserva';
    document.getElementById('reservaForm').reset();
    document.getElementById('reservaId').value = '';
    
    const salas = await listarSalas();
    const salasDisponiveis = salas.filter(s => s.status === 'disponivel');
    const select = document.getElementById('reservaSalaId');
    select.innerHTML = '<option value="">Selecione uma sala disponível</option>' + 
        salasDisponiveis.map(s => `<option value="${s.id}">${s.nome} (Cap: ${s.capacidade})</option>`).join('');
    
    if (salasDisponiveis.length === 0) {
        mostrarToastReserva('Nenhuma sala disponível para reserva!', 'error');
        return;
    }
    
    document.getElementById('reservaModal').classList.remove('hidden');
}

/**
 * Abrir modal para editar reserva
 */
async function abrirModalEditarReserva(reserva) {
    document.getElementById('reservaModalTitle').textContent = 'Editar Reserva';
    document.getElementById('reservaId').value = reserva.id;
    document.getElementById('reservaNome').value = reserva.usuario_nome || '';
    document.getElementById('reservaMatricula').value = reserva.usuario_matricula || '';
    document.getElementById('reservaCargo').value = reserva.usuario_cargo || '';
    document.getElementById('reservaData').value = reserva.data_reserva || '';
    document.getElementById('reservaInicio').value = reserva.hora_inicio || '';
    document.getElementById('reservaFim').value = reserva.hora_fim || '';
    document.getElementById('reservaStatus').value = reserva.status || 'ativo';
    
    const salas = await listarSalas();
    const select = document.getElementById('reservaSalaId');
    select.innerHTML = '<option value="">Selecione uma sala</option>' + 
        salas.map(s => `<option value="${s.id}" ${s.id == reserva.sala_id ? 'selected' : ''}>${s.nome}</option>`).join('');
    
    document.getElementById('reservaModal').classList.remove('hidden');
}

/**
 * Fechar modal
 */
function fecharModalReserva() {
    document.getElementById('reservaModal').classList.add('hidden');
}

/**
 * Salvar reserva (criar ou atualizar)
 */
async function salvarReserva(event) {
    event.preventDefault();
    
    const idField = document.getElementById('reservaId');
    const id = idField.value;
    const idNum = id ? parseInt(id) : null;
    
    const dataReserva = document.getElementById('reservaData').value;
    const horaInicio = document.getElementById('reservaInicio').value;
    const horaFim = document.getElementById('reservaFim').value;
    
    // Validação 1: Data/horário não pode ser no passado
    const now = new Date();
    const reservaDateTime = new Date(`${dataReserva}T${horaInicio}`);
    if (reservaDateTime < now) {
        mostrarToastReserva('Não é possível fazer reservas para data/horário passado!', 'error');
        return;
    }
    
    // Validação 2: Horários devem ser múltiplos de 30 minutos
    const validarMultiplo30 = (hora) => {
        const [h, m] = hora.split(':').map(Number);
        return m === 0 || m === 30;
    };
    
    if (!validarMultiplo30(horaInicio) || !validarMultiplo30(horaFim)) {
        mostrarToastReserva('Os horários devem ser múltiplos de 30 minutos (ex: 14:00, 14:30, 15:00)!', 'error');
        return;
    }
    
    // Validação 3: Duração máxima de 4 horas
    const [h1, m1] = horaInicio.split(':').map(Number);
    const [h2, m2] = horaFim.split(':').map(Number);
    const duracaoMinutos = (h2 * 60 + m2) - (h1 * 60 + m1);
    
    if (duracaoMinutos > 240) { // 4 horas = 240 minutos
        mostrarToastReserva('A reserva não pode exceder 4 horas!', 'error');
        return;
    }
    
    if (duracaoMinutos <= 0) {
        mostrarToastReserva('O horário de fim deve ser maior que o de início!', 'error');
        return;
    }
    
    const reserva = {
        sala_id: parseInt(document.getElementById('reservaSalaId').value),
        usuario_nome: document.getElementById('reservaNome').value,
        usuario_matricula: document.getElementById('reservaMatricula').value,
        usuario_cargo: document.getElementById('reservaCargo').value,
        data_reserva: document.getElementById('reservaData').value,
        hora_inicio: document.getElementById('reservaInicio').value,
        hora_fim: document.getElementById('reservaFim').value,
        status: document.getElementById('reservaStatus').value
    };
    
    try {
        let response;
        if (idNum) {
            response = await fetch('/api/reservas/' + idNum, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reserva)
            });
        } else {
            response = await fetch('/api/reservas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reserva)
            });
        }
        
        const result = await response.json();
        
        if (!response.ok) throw new Error(result.erro || 'Erro ao salvar');
        
        mostrarToastReserva(idNum ? 'Reserva atualizada!' : 'Reserva criada!');
        fecharModalReserva();
        setTimeout(() => carregarReservas(), 100);
    } catch (error) {
        console.error('Erro:', error);
        mostrarToastReserva('Erro ao salvar reserva: ' + error.message, 'error');
    }
}

/**
 * Excluir reserva
 */
async function excluirReserva(id) {
    if (!confirm('Tem certeza que deseja excluir esta reserva?')) return;
    
    try {
        const response = await fetch('/api/reservas/' + id, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Erro ao excluir');
        
        mostrarToastReserva('Reserva excluída!');
        carregarReservas();
    } catch (error) {
        console.error('Erro:', error);
        mostrarToastReserva('Erro ao excluir reserva', 'error');
    }
}

/**
 * Atualizar status da reserva
 */
async function atualizarStatusReserva(id, status) {
    try {
        const response = await fetch('/api/reservas/' + id, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        
        const result = await response.json();
        
        if (!response.ok) throw new Error(result.erro);
        
        mostrarToastReserva('Status atualizado!');
        carregarReservas();
    } catch (error) {
        console.error('Erro:', error);
        mostrarToastReserva('Erro ao atualizar status', 'error');
    }
}

/**
 * Filtrar reservas
 */
async function filtrarReservas() {
    const status = document.getElementById('filtroStatus')?.value || '';
    const cargo = document.getElementById('filtroCargo')?.value || '';
    const data = document.getElementById('filtroData')?.value || '';
    
    const reservas = await listarReservas();
    
    let filtradas = reservas;
    
    if (status) {
        filtradas = filtradas.filter(r => r.status === status);
    }
    if (cargo) {
        filtradas = filtradas.filter(r => r.usuario_cargo === cargo);
    }
    if (data) {
        filtradas = filtradas.filter(r => r.data_reserva === data);
    }
    
    renderizarTabelaReservas(filtradas);
}

/**
 * Renderizar tabela de reservas
 */
let todasReservas = [];
let paginaAtual = 1;
const reservasPorPagina = 5;

function renderizarTabelaReservas(reservas) {
    const tbody = document.querySelector('tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    todasReservas = reservas;
    
    // Atualizar estatísticas dos painéis
    const ativas = reservas.filter(r => r.status === 'ativo').length;
    const atencao = reservas.filter(r => r.status === 'atencao').length;
    
    const elAtivas = document.getElementById('reservas-ativas');
    const elAtencao = document.getElementById('reservas-atencao');
    
    if (elAtivas) elAtivas.textContent = ativas;
    if (elAtencao) elAtencao.textContent = atencao;
    
    const inicio = (paginaAtual - 1) * reservasPorPagina;
    const fim = inicio + reservasPorPagina;
    const reservasPagina = reservas.slice(inicio, fim);
    const totalPaginas = Math.ceil(reservas.length / reservasPorPagina);
    
    const statusLabels = {
        'ativo': { label: 'ATIVO', class: 'bg-secondary-container text-on-secondary-container' },
        'atencao': { label: 'ATENÇÃO', class: 'bg-error-container text-on-error-container' },
        'concluido': { label: 'CONCLUÍDO', class: 'bg-surface-container text-on-surface' },
        'cancelado': { label: 'CANCELADO', class: 'bg-slate-200 text-slate-600' }
    };
    
    reservasPagina.forEach(r => {
        const status = statusLabels[r.status] || statusLabels.ativo;
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-primary/[0.03] transition-colors';
        
        tr.innerHTML = `
<td class="px-6 py-5">
<div class="flex items-center gap-3">
<div class="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold text-xs">${(r.usuario_nome || 'AN')[0]}</div>
<div>
<p class="font-manrope font-bold text-primary text-sm">${r.usuario_nome}</p>
<p class="text-xs text-slate-500">ID: ${r.usuario_matricula}</p>
</div>
</div>
</td>
<td class="px-6 py-5">
<span class="bg-surface-container-high text-primary px-3 py-1 rounded-full text-[11px] font-bold uppercase">${r.usuario_cargo}</span>
</td>
<td class="px-6 py-5">
<div class="flex items-center gap-2">
<span class="material-symbols-outlined text-[18px] text-slate-400">meeting_room</span>
<span class="text-sm font-semibold text-primary">${r.sala_nome}</span>
</div>
</td>
<td class="px-6 py-5">
<div class="text-xs">
<p class="font-bold text-primary">${r.hora_inicio} - ${r.hora_fim}</p>
<p class="text-slate-400">${r.data_reserva}</p>
</div>
</td>
<td class="px-6 py-5">
<span class="${status.class} px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 w-fit">
${r.status === 'atencao' ? '<span class="material-symbols-outlined text-[12px]">warning</span>' : ''}
${status.label}
</span>
</td>
<td class="px-6 py-5 text-right">
<div class="flex items-center justify-end gap-2">
<button class="text-primary text-xs font-bold px-3 py-1.5 rounded-lg border border-primary/20 hover:bg-primary hover:text-white" onclick='abrirModalEditarReserva(${JSON.stringify(r)})'>Detalhes</button>
<button class="text-error text-xs font-bold px-3 py-1.5 rounded-lg border border-error/20 hover:bg-error hover:text-white" onclick="excluirReserva(${r.id})">Excluir</button>
</div>
</td>`;
        
        tbody.appendChild(tr);
    });
    
    // Atualizar info da paginação
    const infoEl = document.getElementById('pagination-info');
    if (infoEl) {
        if (reservas.length === 0) {
            infoEl.textContent = 'Nenhum resultado encontrado';
        } else {
            const Showing = Math.min(fim, reservas.length);
            infoEl.textContent = `Mostrando ${inicio + 1} a ${Showing} de ${reservas.length} reservas`;
        }
    }
    
    // Renderizar botões de paginação
    renderizarBotoesPagina(totalPaginas);
}

function renderizarBotoesPagina(totalPaginas) {
    const container = document.getElementById('pagination-buttons');
    if (!container) {
        console.error('[DEBUG] container pagination-buttons não encontrado!');
        return;
    }
    
    container.innerHTML = '';
    
    if (totalPaginas <= 1) return;
    
    // Botão anterior
    const btnPrev = document.createElement('button');
    btnPrev.className = 'w-8 h-8 flex items-center justify-center rounded-lg border border-surface-container text-slate-400 hover:bg-surface-container transition-colors' + (paginaAtual === 1 ? ' opacity-50 cursor-not-allowed' : '');
    btnPrev.innerHTML = '<span class="material-symbols-outlined text-[18px]">chevron_left</span>';
    btnPrev.onclick = () => { 
    if (paginaAtual > 1) { paginaAtual--; carregarReservas(); } 
    };
    if (paginaAtual === 1) btnPrev.disabled = true;
    container.appendChild(btnPrev);
    
    // Botões de páginas
    for (let i = 1; i <= totalPaginas; i++) {
        const btn = document.createElement('button');
        btn.className = 'w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold ' + (i === paginaAtual ? 'bg-primary text-white' : 'hover:bg-surface-container text-primary');
        btn.textContent = i;
        btn.onclick = () => { paginaAtual = i; carregarReservas(); };
        container.appendChild(btn);
    }
    
    // Botão próximo
    const btnNext = document.createElement('button');
    btnNext.className = 'w-8 h-8 flex items-center justify-center rounded-lg border border-surface-container text-slate-400 hover:bg-surface-container transition-colors' + (paginaAtual === totalPaginas ? ' opacity-50 cursor-not-allowed' : '');
    btnNext.innerHTML = '<span class="material-symbols-outlined text-[18px]">chevron_right</span>';
    btnNext.onclick = () => { 
        if (paginaAtual < totalPaginas) { paginaAtual++; carregarReservas(); } 
    };
    if (paginaAtual === totalPaginas) btnNext.disabled = true;
    container.appendChild(btnNext);
}

/**
 * Carregar reservas
 */
async function carregarReservas() {
    const reservas = await listarReservas();
    if (reservas) {
        renderizarTabelaReservas(reservas);
    }
}

/**
 * Inicializar reservas
 */
async function inicializarReservas() {
    await carregarReservas();
    
    const form = document.getElementById('reservaForm');
    if (form) form.addEventListener('submit', salvarReserva);
    
    const modal = document.getElementById('reservaModal');
    if (modal) modal.addEventListener('click', e => { if (e.target === modal) fecharModalReserva(); });
    
    // Event listeners para filtros
    const filtros = ['filtroStatus', 'filtroCargo', 'filtroData'];
    filtros.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', filtrarReservas);
    });
}

window.abrirModalNovaReserva = abrirModalNovaReserva;
window.abrirModalEditarReserva = abrirModalEditarReserva;
window.fecharModalReserva = fecharModalReserva;
window.excluirReserva = excluirReserva;
window.atualizarStatusReserva = atualizarStatusReserva;
window.carregarReservas = carregarReservas;
window.inicializarReservas = inicializarReservas;