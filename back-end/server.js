/**
 * Servidor Backend para SIFU Biblioteca UFERSA
 * 
 * Usa arquivos JSON locais para persistência de dados.
 * Não requer dependências externas (express/sqlite3).
 * 
 * @author Robson Ruan
 * @version 1.1.0
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');

/**
 * Carrega dados de um arquivo JSON
 */
function loadData(filename) {
    try {
        const data = fs.readFileSync(path.join(DATA_DIR, filename), 'utf8');
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
}

/**
 * Salva dados em um arquivo JSON
 */
function saveData(filename, data) {
    fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2));
}

/**
 * Registra uma ação no log de eventos
 */
function registrarLog(modulo, acao, usuarioNome, usuarioMatricula, detalhes) {
    const logs = loadData('logs.json');
    const novoLog = {
        id: logs.length > 0 ? Math.max(...logs.map(l => l.id)) + 1 : 1,
        modulo: modulo,
        acao: acao,
        usuario_nome: usuarioNome || 'Sistema',
        usuario_matricula: usuarioMatricula || '-',
        detalhes: detalhes,
        data_hora: new Date().toISOString()
    };
    logs.push(novoLog);
    saveData('logs.json', logs);
}

/**
 * API de Logs - Visualização de Eventos (RF de Log)
 */
function apiLogs(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }
    
    const logs = loadData('logs.json');
    res.end(JSON.stringify(logs));
}

/**
 * Rotas da API - Salas (GET, POST, PUT, DELETE)
 */
function apiSalas(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Handle OPTIONS
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }
    
    // Parse da URL para obter ID
    let url = req.url;
    if (url.startsWith('/')) url = url.substring(1);
    const pathParts = url.split('/');
    // URL: api/salas/1 -> ['api', 'salas', '1']
    const id = pathParts.length > 2 && !isNaN(pathParts[2]) ? parseInt(pathParts[2]) : null;
    const salas = loadData('salas.json');
    
    console.log('API salas - url:', req.url, '- method:', req.method, '- id:', id);
    
    if (req.method === 'GET') {
        if (id) {
            const sala = salas.find(s => s.id == id);
            if (sala) {
                res.end(JSON.stringify(sala));
            } else {
                res.writeHead(404);
                res.end(JSON.stringify({ erro: 'Sala não encontrada' }));
            }
        } else {
            res.end(JSON.stringify(salas));
        }
    } else if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const novaSala = JSON.parse(body);
                novaSala.id = salas.length > 0 ? Math.max(...salas.map(s => s.id)) + 1 : 1;
                salas.push(novaSala);
                saveData('salas.json', salas);
                registrarLog('Salas', 'CRIAR', 'Admin', '-admin', `Sala "${novaSala.nome}" criada (Capacidade: ${novaSala.capacidade})`);
                res.writeHead(201);
                res.end(JSON.stringify({ id: novaSala.id, mensagem: 'Sala criada com sucesso' }));
            } catch (e) {
                res.writeHead(400);
                res.end(JSON.stringify({ erro: 'Dados inválidos' }));
            }
        });
    } else if (req.method === 'PUT') {
        const index = salas.findIndex(s => s.id == id);
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const dados = JSON.parse(body);
                const index = salas.findIndex(s => s.id === id);
                if (index === -1) {
                    res.writeHead(404);
                    res.end(JSON.stringify({ erro: 'Sala não encontrada' }));
                    return;
                }
                salas[index] = { ...salas[index], ...dados, id: id };
                saveData('salas.json', salas);
                registrarLog('Salas', 'ATUALIZAR', 'Admin', '-admin', `Sala ID ${id} atualizada`);
                res.end(JSON.stringify({ mensagem: 'Sala atualizada com sucesso' }));
            } catch (e) {
                res.writeHead(400);
                res.end(JSON.stringify({ erro: 'Dados inválidos' }));
            }
        });
    } else if (req.method === 'DELETE') {
        const index = salas.findIndex(s => s.id == id);
        if (index === -1) {
            res.writeHead(404);
            res.end(JSON.stringify({ erro: 'Sala não encontrada' }));
            return;
        }
        const salaRemovida = salas[index];
        salas.splice(index, 1);
        saveData('salas.json', salas);
        registrarLog('Salas', 'EXCLUIR', 'Admin', '-admin', `Sala "${salaRemovida.nome}" excluída`);
        res.end(JSON.stringify({ mensagem: 'Sala removida com sucesso' }));
    } else {
        res.end(JSON.stringify({ erro: 'Método não suportado' }));
    }
}

/**
 * Rotas da API - Reservas (GET, POST, PUT, DELETE)
 */
function apiReservas(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }
    
    let url = req.url;
    if (url.startsWith('/')) url = url.substring(1);
    const pathParts = url.split('/');
    const id = pathParts.length > 2 && !isNaN(pathParts[2]) ? parseInt(pathParts[2]) : null;
    const reservas = loadData('reservas.json');
    const salas = loadData('salas.json');
    
    if (req.method === 'GET') {
        const reservasWithSala = reservas.map(r => {
            const sala = salas.find(s => s.id == r.sala_id);
            return { ...r, sala_nome: sala ? sala.nome : 'Sala #' + r.sala_id };
        });
        res.end(JSON.stringify(reservasWithSala));
    } else if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const novaReserva = JSON.parse(body);
                
                const { data_reserva, hora_inicio, hora_fim } = novaReserva;
                
                if (data_reserva && hora_inicio) {
                    const now = new Date();
                    const reservaDateTime = new Date(`${data_reserva}T${hora_inicio}`);
                    if (reservaDateTime < now) {
                        res.writeHead(400);
                        res.end(JSON.stringify({ erro: 'Não é possível fazer reservas para data/horário passado!' }));
                        return;
                    }
                }
                
                if (hora_inicio && hora_fim) {
                    const validarMultiplo30 = (hora) => {
                        const [, m] = hora.split(':').map(Number);
                        return m === 0 || m === 30;
                    };
                    
                    if (!validarMultiplo30(hora_inicio) || !validarMultiplo30(hora_fim)) {
                        res.writeHead(400);
                        res.end(JSON.stringify({ erro: 'Os horários devem ser múltiplos de 30 minutos (ex: 14:00, 14:30, 15:00)!' }));
                        return;
                    }
                    
                    const [h1, m1] = hora_inicio.split(':').map(Number);
                    const [h2, m2] = hora_fim.split(':').map(Number);
                    const duracaoMinutos = (h2 * 60 + m2) - (h1 * 60 + m1);
                    
                    if (duracaoMinutos <= 0) {
                        res.writeHead(400);
                        res.end(JSON.stringify({ erro: 'O horário de fim deve ser maior que o de início!' }));
                        return;
                    }
                    if (duracaoMinutos > 240) {
                        res.writeHead(400);
                        res.end(JSON.stringify({ erro: 'A reserva não pode exceder 4 horas!' }));
                        return;
                    }
                }
                
                novaReserva.id = reservas.length > 0 ? Math.max(...reservas.map(r => r.id)) + 1 : 1;
                reservas.push(novaReserva);
                saveData('reservas.json', reservas);
                registrarLog('Reservas', 'CRIAR', novaReserva.usuario_nome, novaReserva.usuario_matricula, `Reserva para Sala ID ${novaReserva.sala_id} em ${novaReserva.data_reserva}`);
                res.writeHead(201);
                res.end(JSON.stringify({ id: novaReserva.id, mensagem: 'Reserva criada com sucesso' }));
            } catch (e) {
                res.writeHead(400);
                res.end(JSON.stringify({ erro: 'Dados inválidos' }));
            }
        });
    } else if (req.method === 'PUT') {
        const index = reservas.findIndex(r => r.id == id);
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const dados = JSON.parse(body);
                if (index === -1) {
                    res.writeHead(404);
                    res.end(JSON.stringify({ erro: 'Reserva não encontrada' }));
                    return;
                }
                
                const { data_reserva, hora_inicio, hora_fim } = dados;
                
                if (data_reserva && hora_inicio) {
                    const now = new Date();
                    const reservaDateTime = new Date(`${data_reserva}T${hora_inicio}`);
                    if (reservaDateTime < now) {
                        res.writeHead(400);
                        res.end(JSON.stringify({ erro: 'Não é possível fazer reservas para data/horário passado!' }));
                        return;
                    }
                }
                
                if (hora_inicio && hora_fim) {
                    const validarMultiplo30 = (hora) => {
                        const [, m] = hora.split(':').map(Number);
                        return m === 0 || m === 30;
                    };
                    
                    if (!validarMultiplo30(hora_inicio) || !validarMultiplo30(hora_fim)) {
                        res.writeHead(400);
                        res.end(JSON.stringify({ erro: 'Os horários devem ser múltiplos de 30 minutos!' }));
                        return;
                    }
                    
                    const [h1, m1] = hora_inicio.split(':').map(Number);
                    const [h2, m2] = hora_fim.split(':').map(Number);
                    const duracaoMinutos = (h2 * 60 + m2) - (h1 * 60 + m1);
                    
                    if (duracaoMinutos <= 0) {
                        res.writeHead(400);
                        res.end(JSON.stringify({ erro: 'O horário de fim deve ser maior que o de início!' }));
                        return;
                    }
                    if (duracaoMinutos > 240) {
                        res.writeHead(400);
                        res.end(JSON.stringify({ erro: 'A reserva não pode exceder 4 horas!' }));
                        return;
                    }
                }
                
                reservas[index] = { ...reservas[index], ...dados, id: id };
                saveData('reservas.json', reservas);
                res.end(JSON.stringify({ mensagem: 'Reserva atualizada com sucesso' }));
            } catch (e) {
                res.writeHead(400);
                res.end(JSON.stringify({ erro: 'Dados inválidos' }));
            }
        });
    } else if (req.method === 'DELETE') {
        const index = reservas.findIndex(r => r.id == id);
        if (index === -1) {
            res.writeHead(404);
            res.end(JSON.stringify({ erro: 'Reserva não encontrada' }));
            return;
        }
        const reservaRemovida = reservas[index];
        reservas.splice(index, 1);
        saveData('reservas.json', reservas);
        registrarLog('Reservas', 'EXCLUIR', reservaRemovida.usuario_nome, reservaRemovida.usuario_matricula, `Reserva ID ${id} cancelada`);
        res.end(JSON.stringify({ mensagem: 'Reserva removida com sucesso' }));
    } else {
        res.end(JSON.stringify({ erro: 'Método não suportado' }));
    }
}

/**
 * API Status
 */
function apiStatus(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: 'online', timestamp: new Date().toISOString() }));
}

/**
 * Rotas da API - Materiais (GET, POST, PUT, DELETE)
 */
function apiMateriais(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }
    
    let url = req.url;
    if (url.startsWith('/')) url = url.substring(1);
    const pathParts = url.split('/');
    const id = pathParts.length > 2 && !isNaN(pathParts[2]) ? parseInt(pathParts[2]) : null;
    const materiais = loadData('materiais.json');
    const salas = loadData('salas.json');
    
    if (req.method === 'GET') {
        const materiaisWithSala = materiais.map(m => {
            // Primeiro verifica sala_id direto
            let sala = salas.find(s => s.id == m.sala_id);
            
            // Se não encontrar, procura nos recursos das salas
            if (!sala && m.status === 'em_uso') {
                const nomeNormalizado = m.nome.replace(/["\\]/g, '').trim();
                for (const s of salas) {
                    if (s.recursos) {
                        const recursosArray = s.recursos.split(',').map(r => r.replace(/["\\]/g, '').trim());
                        if (recursosArray.includes(nomeNormalizado) || recursosArray.some(r => m.nome.includes(r))) {
                            sala = s;
                            break;
                        }
                    }
                }
            }
            
            return { ...m, sala_nome: sala ? sala.nome : '-' };
        });
        res.end(JSON.stringify(materiaisWithSala));
    } else if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const novoMaterial = JSON.parse(body);
                novoMaterial.id = materiais.length > 0 ? Math.max(...materiais.map(m => m.id)) + 1 : 1;
                materiais.push(novoMaterial);
                saveData('materiais.json', materiais);
                registrarLog('Materiais', 'CRIAR', 'Admin', '-admin', `Material "${novoMaterial.nome}" (${novoMaterial.codigo}) criado`);
                res.writeHead(201);
                res.end(JSON.stringify({ id: novoMaterial.id, mensagem: 'Material criado com sucesso' }));
            } catch (e) {
                res.writeHead(400);
                res.end(JSON.stringify({ erro: 'Dados inválidos' }));
            }
        });
    } else if (req.method === 'PUT') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const dados = JSON.parse(body);
                const index = materiais.findIndex(m => m.id == id);
                if (index === -1) {
                    res.writeHead(404);
                    res.end(JSON.stringify({ erro: 'Material não encontrado' }));
                    return;
                }
                materiais[index] = { ...materiais[index], ...dados, id: id };
                saveData('materiais.json', materiais);
                res.end(JSON.stringify({ mensagem: 'Material atualizado com sucesso' }));
            } catch (e) {
                res.writeHead(400);
                res.end(JSON.stringify({ erro: 'Dados inválidos' }));
            }
        });
    } else if (req.method === 'DELETE') {
        const index = materiais.findIndex(m => m.id == id);
        if (index === -1) {
            res.writeHead(404);
            res.end(JSON.stringify({ erro: 'Material não encontrado' }));
            return;
        }
        const materialRemovido = materiais[index];
        materiais.splice(index, 1);
        saveData('materiais.json', materiais);
        registrarLog('Materiais', 'EXCLUIR', 'Admin', '-admin', `Material "${materialRemovido.nome}" excluído`);
        res.end(JSON.stringify({ mensagem: 'Material removido com sucesso' }));
    } else {
        res.end(JSON.stringify({ erro: 'Método não suportado' }));
    }
}

/**
 * Rotas da API - Ocorrências (RF10 - Gerenciar pendências e danos)
 * GET, POST, PUT, DELETE
 */
function apiOcorrencias(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }
    
    let url = req.url;
    if (url.startsWith('/')) url = url.substring(1);
    const pathParts = url.split('/');
    const id = pathParts.length > 2 && !isNaN(pathParts[2]) ? parseInt(pathParts[2]) : null;
    const ocorrencias = loadData('ocorrencias.json');
    const salas = loadData('salas.json');
    const reservas = loadData('reservas.json');
    
    if (req.method === 'GET') {
        // Retorna ocorrências com informações relacionadas
        const ocorrenciasFull = ocorrencias.map(o => {
            const sala = salas.find(s => s.id == o.sala_id);
            return { 
                ...o, 
                sala_nome: sala ? sala.nome : 'Sala #' + o.sala_id 
            };
        });
        res.end(JSON.stringify(ocorrenciasFull));
    } else if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const novaOcorrencia = JSON.parse(body);
                
                // Valida campos obrigatórios
                if (!novaOcorrencia.descricao || !novaOcorrencia.aluno_nome || !novaOcorrencia.aluno_matricula) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ erro: 'Campos obrigatórios: descricao, aluno_nome, aluno_matricula' }));
                    return;
                }
                
                novaOcorrencia.id = ocorrencias.length > 0 ? Math.max(...ocorrencias.map(o => o.id)) + 1 : 1;
                novaOcorrencia.status = novaOcorrencia.status || 'em_analise';
                novaOcorrencia.data_criacao = new Date().toISOString();
                novaOcorrencia.data_atualizacao = new Date().toISOString();
                
                ocorrencias.push(novaOcorrencia);
                saveData('ocorrencias.json', ocorrencias);
                registrarLog('Ocorrências', 'CRIAR', novaOcorrencia.aluno_nome, novaOcorrencia.aluno_matricula, `Ocorrência registrada: ${novaOcorrencia.descricao}`);
                
                res.writeHead(201);
                res.end(JSON.stringify({ 
                    id: novaOcorrencia.id, 
                    mensagem: 'Ocorrência registrada com sucesso',
                    status: novaOcorrencia.status
                }));
            } catch (e) {
                res.writeHead(400);
                res.end(JSON.stringify({ erro: 'Dados inválidos' }));
            }
        });
    } else if (req.method === 'PUT') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const dados = JSON.parse(body);
                const index = ocorrencias.findIndex(o => o.id == id);
                
                if (index === -1) {
                    res.writeHead(404);
                    res.end(JSON.stringify({ erro: 'Ocorrência não encontrada' }));
                    return;
                }
                
                // Atualiza campos permitidos
                const camposPermitidos = ['status', 'descricao', 'funcionario_responsave', 'foto_url', 'observacoes'];
                camposPermitidos.forEach(campo => {
                    if (dados[campo] !== undefined) {
                        ocorrencias[index][campo] = dados[campo];
                    }
                });
                
                // Validações de status
                if (dados.status) {
                    if (!['em_analise', 'resolvido', 'cancelado'].includes(dados.status)) {
                        res.writeHead(400);
                        res.end(JSON.stringify({ erro: 'Status inválido. Use: em_analise, resolvido, cancelado' }));
                        return;
                    }
                }
                
                ocorrencias[index].data_atualizacao = new Date().toISOString();
                saveData('ocorrencias.json', ocorrencias);
                
                res.end(JSON.stringify({ mensagem: 'Ocorrência atualizada com sucesso', status: ocorrencias[index].status }));
            } catch (e) {
                res.writeHead(400);
                res.end(JSON.stringify({ erro: 'Dados inválidos' }));
            }
        });
    } else if (req.method === 'DELETE') {
        const index = ocorrencias.findIndex(o => o.id == id);
        if (index === -1) {
            res.writeHead(404);
            res.end(JSON.stringify({ erro: 'Ocorrência não encontrada' }));
            return;
        }
        ocorrencias.splice(index, 1);
        saveData('ocorrencias.json', ocorrencias);
        res.end(JSON.stringify({ mensagem: 'Ocorrência removida com sucesso' }));
    } else {
        res.end(JSON.stringify({ erro: 'Método não suportado' }));
    }
}

/**
 * API - Verificar se aluno tem pendências ativas (bloqueio de reservas)
 * GET /api/ocorrencias/bloqueio/:matricula
 */
function apiVerificarBloqueio(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    let url = req.url;
    if (url.startsWith('/')) url = url.substring(1);
    const pathParts = url.split('/');
    const matricula = pathParts.length > 2 ? decodeURIComponent(pathParts[2]) : null;
    
    if (!matricula) {
        res.writeHead(400);
        res.end(JSON.stringify({ erro: 'Matrícula não fornecida' }));
        return;
    }
    
    const ocorrencias = loadData('ocorrencias.json');
    const pendenciasAtivas = ocorrencias.filter(o => 
        o.aluno_matricula === matricula && o.status === 'em_analise'
    );
    
    res.end(JSON.stringify({
        bloqueado: pendenciasAtivas.length > 0,
        quantidade_pendencias: pendenciasAtivas.length,
        pendencias: pendenciasAtivas.map(p => ({
            id: p.id,
            descricao: p.descricao,
            data: p.data_criacao,
            sala: p.sala_id
        }))
    }));
}

/**
 * Servir arquivos estáticos
 */
function serveStatic(req, res, filePath) {
    try {
        const content = fs.readFileSync(filePath);
        const ext = path.extname(filePath);
        const contentTypes = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg'
        };
        res.setHeader('Content-Type', contentTypes[ext] || 'text/plain');
        res.end(content);
    } catch (e) {
        res.writeHead(404);
        res.end('Not Found');
    }
}

/**
 * Servidor HTTP
 */
const server = http.createServer((req, res) => {
    const url = req.url.split('?')[0];
    
    console.log(`[${new Date().toISOString()}] ${req.method} ${url}`);
    
    // API Routes
    if (url.startsWith('/api/salas')) {
        return apiSalas(req, res);
    }
    if (url.startsWith('/api/reservas')) {
        return apiReservas(req, res);
    }
    if (url.startsWith('/api/materiais')) {
        return apiMateriais(req, res);
    }
    if (url.startsWith('/api/ocorrencias/bloqueio')) {
        return apiVerificarBloqueio(req, res);
    }
    if (url.startsWith('/api/ocorrencias')) {
        return apiOcorrencias(req, res);
    }
    if (url.startsWith('/api/logs')) {
        return apiLogs(req, res);
    }
    if (url.startsWith('/api/ocorrencias/bloqueio')) {
        return apiVerificarBloqueio(req, res);
    }
    if (url.startsWith('/api/ocorrencias')) {
        return apiOcorrencias(req, res);
    }
    if (url === '/api/status') {
        return apiStatus(req, res);
    }
    
    // Static files from front-end directory - must be after API routes
    // Serve JS files
    if (url.startsWith('js/') || url.startsWith('/js/')) {
        const filePath = path.join(__dirname, '..', 'front-end', url.startsWith('/') ? url.substring(1) : url);
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            return serveStatic(req, res, filePath);
        }
    }
    
    // Serve page directories
    const staticDirs = ['gestao_salas', 'ia_relatorios', 'painel_institucional', 'reservas_emprestimos', 'inventario', 'ocorrencias'];
    for (const dir of staticDirs) {
        const match = url.startsWith(dir + '/') || url === dir || url === '/' + dir + '/code.html' || url === dir + '/code.html' || url === '/' + dir;
        if (match) {
            let file = url;
            if (url === dir || url === '/' + dir) {
                file = dir + '/code.html';
            } else if (url === '/' + dir + '/code.html') {
                file = dir + '/code.html';
            }
            const filePath = path.join(__dirname, '..', 'front-end', file);
            if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
                return serveStatic(req, res, filePath);
            }
        }
    }
    
    // Root page
    if (url === '/' || url === '') {
        res.setHeader('Content-Type', 'text/html');
        res.end(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SIFU Biblioteca UFERSA</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', sans-serif; 
            background: linear-gradient(135deg, #082853 0%, #14C286 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 600px;
            text-align: center;
        }
        h1 { color: #082853; margin-bottom: 10px; }
        p { color: #666; margin-bottom: 30px; }
        .menu { display: grid; gap: 15px; }
        .menu a {
            display: block;
            padding: 15px 25px;
            background: #F1F3FF;
            color: #082853;
            text-decoration: none;
            border-radius: 10px;
            font-weight: 600;
            transition: all 0.3s;
        }
        .menu a:hover {
            background: #082853;
            color: white;
            transform: translateX(5px);
        }
        .status { 
            margin-top: 30px; 
            padding: 15px; 
            background: #d7e2ff; 
            border-radius: 10px;
            color: #082853;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📚 SIFU Biblioteca UFERSA</h1>
        <p>Sistema Integrado Funcional e Unificado</p>
        
        <div class="menu">
            <a href="/gestao_salas/code.html">🏠 Gestão de Salas</a>
            <a href="/reservas_emprestimos/code.html">📅 Reservas e Empréstimos</a>
            <a href="/ia_relatorios/code.html">🤖 IA e Relatórios</a>
            <a href="/painel_institucional/code.html">📊 Painel Institucional</a>
        </div>
        
        <div class="status">✅ Servidor online - Dados carregados!</div>
    </div>
</body>
</html>
        `);
        return;
    }
    
    // 404
    res.writeHead(404);
    res.end('Not Found');
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n========================================`);
    console.log(`  Servidor SIFU Biblioteca UFERSA`);
    console.log(`  Executando em: http://localhost:${PORT}`);
    console.log(`========================================`);
    console.log(`\n  📄 Páginas:`);
    console.log(`  • http://localhost:${PORT}/`);
    console.log(`  • http://localhost:${PORT}/gestao_salas/code.html`);
    console.log(`  • http://localhost:${PORT}/reservas_emprestimos/code.html`);
    console.log(`\n  🔌 API:`);
    console.log(`  • GET/POST   /api/salas`);
    console.log(`  • GET/POST   /api/reservas`);
    console.log(`  • GET/POST   /api/materiais`);
    console.log(`  • GET/POST/PUT/DELETE /api/ocorrencias`);
    console.log(`  • GET        /api/ocorrencias/bloqueio/:matricula`);
    console.log(`\========================================\n`);
});