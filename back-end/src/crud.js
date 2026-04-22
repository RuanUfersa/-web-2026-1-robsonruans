const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

console.log('SIFU Backend - Serverless Offline');

const DATA_FILE = path.join(__dirname, '..', 'data', 'database.json');

function loadDB() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (e) {
    console.log('Erro ao carregar banco:', e.message);
  }
  return { UFERSA_Salas: [], UFERSA_Reservas: [], UFERSA_Ocorrencias: [], UFERSA_Inventario: [] };
}

function saveDB(data) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.log('Erro ao salvar banco:', e.message);
  }
}

let db = loadDB();
console.log('Banco carregado:', Object.keys(db));

const getAll = async (t) => db[t] || [];
const getById = async (t, id) => (db[t] || []).find(i => i.id === id);
const create = async (t, item) => { if (!db[t]) db[t] = []; db[t].push(item); saveDB(db); return item; };
const update = async (t, id, data) => { const items = db[t] || []; const idx = items.findIndex(i => i.id === id); if (idx === -1) return null; items[idx] = { ...items[idx], ...data, data_atualizacao: new Date().toISOString() }; saveDB(db); return items[idx]; };
const remove = async (t, id) => { const items = db[t] || []; const idx = items.findIndex(i => i.id === id); if (idx !== -1) { items.splice(idx, 1); saveDB(db); } return { mensagem: 'Excluído' }; };

function createResponse(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(body), isBase64Encoded: false };
}

function getMethod(event) { return (event.routeKey || '').split(' ')[0] || event.httpMethod || event.requestContext?.http?.method || 'GET'; }
function getPath(event) { return event.rawPath || event.path || event.requestContext?.http?.path || '/'; }

exports.salasHandler = async (event) => {
  const method = getMethod(event);
  const reqPath = getPath(event);
  const pathParts = reqPath.split('/').filter(Boolean);
  const id = event.pathParameters?.id || (pathParts.length > 2 ? pathParts[pathParts.length - 1] : null);
  let body = {};
  try { if (event.body) body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body; } catch (e) {}
  try {
    if (method === 'GET' && !id) return createResponse(200, await getAll('UFERSA_Salas'));
    if (method === 'GET' && id) return createResponse(200, await getById('UFERSA_Salas', id) || {});
    if (method === 'POST') {
      const { nome, capacidade, tipo, recursos, status } = body;
      if (!nome || !capacidade || !tipo) return createResponse(400, { erro: 'Campos obrigatórios' });
      const salle = { id: uuidv4(), nome, capacidade: parseInt(capacidade), tipo, recursos: recursos || [], status: status || 'disponivel', data_criacao: new Date().toISOString() };
      await create('UFERSA_Salas', salle);
      return createResponse(201, salle);
    }
    if (method === 'PUT' && id) return createResponse(200, await update('UFERSA_Salas', id, body) || { erro: 'Não encontrado' });
    if (method === 'DELETE' && id) { await remove('UFERSA_Salas', id); return createResponse(200, { mensagem: 'Excluído' }); }
    return createResponse(405, { erro: 'Método não permitido' });
  } catch (error) { return createResponse(500, { erro: error.message }); }
};

exports.reservasHandler = async (event) => {
  const method = getMethod(event);
  const reqPath = getPath(event);
  const pathParts = reqPath.split('/').filter(Boolean);
  const id = event.pathParameters?.id || (pathParts.length > 2 ? pathParts[pathParts.length - 1] : null);
  let body = {};
  try { if (event.body) body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body; } catch (e) {}
  try {
    if (method === 'GET' && !id) return createResponse(200, await getAll('UFERSA_Reservas'));
    if (method === 'POST') {
      const reserva = { id: uuidv4(), ...body, status: body.status || 'ativo', data_criacao: new Date().toISOString() };
      await create('UFERSA_Reservas', reserva);
      return createResponse(201, reserva);
    }
    if (method === 'PUT' && id) return createResponse(200, await update('UFERSA_Reservas', id, body) || { erro: 'Não encontrado' });
    if (method === 'DELETE' && id) { await remove('UFERSA_Reservas', id); return createResponse(200, { mensagem: 'Excluído' }); }
    return createResponse(405, { erro: 'Método não permitido' });
  } catch (error) { return createResponse(500, { erro: error.message }); }
};

exports.ocorrenciasHandler = async (event) => {
  const method = getMethod(event);
  const reqPath = getPath(event);
  const pathParts = reqPath.split('/').filter(Boolean);
  const id = event.pathParameters?.id || (pathParts.length > 2 ? pathParts[pathParts.length - 1] : null);
  let body = {};
  try { if (event.body) body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body; } catch (e) {}
  try {
    if (method === 'GET' && !id) return createResponse(200, await getAll('UFERSA_Ocorrencias'));
    if (method === 'POST') {
      const occ = { id: uuidv4(), ...body, status: body.status || 'em_analise', data_criacao: new Date().toISOString() };
      await create('UFERSA_Ocorrencias', occ);
      return createResponse(201, occ);
    }
    if (method === 'DELETE' && id) { await remove('UFERSA_Ocorrencias', id); return createResponse(200, { mensagem: 'Excluído' }); }
    return createResponse(405, { erro: 'Método não permitido' });
  } catch (error) { return createResponse(500, { erro: error.message }); }
};

exports.inventarioHandler = async (event) => {
  const method = getMethod(event);
  const reqPath = getPath(event);
  const pathParts = reqPath.split('/').filter(Boolean);
  const id = event.pathParameters?.id || (pathParts.length > 2 ? pathParts[pathParts.length - 1] : null);
  let body = {};
  try { if (event.body) body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body; } catch (e) {}
  try {
    if (method === 'GET' && !id) return createResponse(200, await getAll('UFERSA_Inventario'));
    if (method === 'POST') {
      const mat = { id: uuidv4(), ...body, status: body.status || 'disponivel', data_criacao: new Date().toISOString() };
      await create('UFERSA_Inventario', mat);
      return createResponse(201, mat);
    }
    if (method === 'DELETE' && id) { await remove('UFERSA_Inventario', id); return createResponse(200, { mensagem: 'Excluído' }); }
    return createResponse(405, { erro: 'Método não permitido' });
  } catch (error) { return createResponse(500, { erro: error.message }); }
};

exports.staticHandler = async () => createResponse(200, { mensagem: 'SIFU API' });
exports.indexHandler = async () => createResponse(200, { mensagem: 'SIFU Biblioteca UFERSA - API Serverless Offline' });

const FRONTEND_PATH = path.join(__dirname, '..', 'front-end');
exports.frontEndHandler = async (event) => {
  let reqPath = event.rawPath || event.path || '/';
  console.log('frontEndHandler chamado, path:', reqPath);
  
  // Se for raiz, redirecionar para painel
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/painel_institucional/code.html';
  }
  
  // Adicionar code.html se for diretório
  if (!reqPath.includes('.')) {
    reqPath = reqPath + '/code.html';
  }
  
  // Remover slash inicial
  let filePath = reqPath.startsWith('/') ? reqPath.substring(1) : reqPath;
  
  // Limitar caminhos para evitar segurança
  if (filePath.includes('..')) {
    return createResponse(403, { erro: 'Acesso negado' });
  }
  
  const fullPath = path.join(FRONTEND_PATH, filePath);
  
  try {
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      const ext = path.extname(fullPath).toLowerCase();
      const contentType = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml'
      }[ext] || 'text/plain';
      
      const content = fs.readFileSync(fullPath);
      return {
        statusCode: 200,
        headers: { 'Content-Type': contentType, 'Access-Control-Allow-Origin': '*' },
        body: content.toString('base64'),
        isBase64Encoded: true
      };
    }
  } catch (e) {
    console.log('Erro ao servir arquivo:', e.message);
  }
  
  return createResponse(404, { erro: 'Página não encontrada' });
};