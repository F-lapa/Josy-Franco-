import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc, deleteDoc, query, where, getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBl55ZrLR6Bgy0WHa-HoACm25mC8_l4awY",
    authDomain: "terapia-fb9b6.firebaseapp.com",
    projectId: "terapia-fb9b6",
    storageBucket: "terapia-fb9b6.firebasestorage.app",
    messagingSenderId: "237600219486",
    appId: "1:237600219486:web:ff6d0a717a75e34ec1afcf",
    measurementId: "G-MFFES61WRX"
};

const app = initializeApp(firebaseConfig);
console.log('[SUCESSO] Firebase inicializado com sucesso');
const auth = getAuth(app);
const db = getFirestore(app);

const SENHA_MESTRE = "administrador";
let senhaAtual = localStorage.getItem('userPassword') || "terapia";
let listaClientes = [];
let listaAgendamentos = [];
let listaFluxoCaixa = [];

async function inicializarAutenticacao() {
    try {
        console.log('[DEBUG] Tentando autenticação anônima com auth:', auth);
        const credencialUsuario = await signInAnonymously(auth);
        console.log('[SUCESSO] Autenticação anônima realizada com sucesso para o usuário:', credencialUsuario.user.uid);
        localStorage.setItem('loggedIn', 'true');
        await Promise.all([carregarClientes(), carregarAgendamentos(), carregarFluxoCaixa()]);
        configurarAutocompletarCliente();
        configurarAutocompletarFluxoCaixa();
    } catch (error) {
        console.error('[ERRO] Erro ao autenticar anonimamente:', error.code, error.message);
        alert('Erro ao autenticar. Verifique sua conexão ou as permissões no Firebase.');
        throw error;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const estaLogado = localStorage.getItem('loggedIn');
    if (!estaLogado) {
        window.location.href = 'index.html';
    } else {
        inicializarAutenticacao().catch(error => {
            console.error('[ERRO] Erro ao inicializar autenticação:', error);
        });
    }

    const entradaTelefone = document.getElementById('telefone');
    if (entradaTelefone) IMask(entradaTelefone, { mask: '(00) 90000-0000' });

    const entradaDataNascimento = document.getElementById('dataNascimento');
    if (entradaDataNascimento) {
        IMask(entradaDataNascimento, {
            mask: '00/00/0000',
            lazy: false,
            placeholderChar: '_',
            overwrite: true,
            autofix: true,
            blocks: {
                '00': { mask: IMask.MaskedRange, from: 1, to: 31 },
                '00[1]': { mask: IMask.MaskedRange, from: 1, to: 12 },
                '0000': { mask: IMask.MaskedRange, from: 1925, to: new Date().getFullYear() }
            }
        });
    }

    const entradaBuscaData = document.getElementById('dateSearch');
    if (entradaBuscaData) {
        IMask(entradaBuscaData, {
            mask: '00/00/0000',
            lazy: false,
            placeholderChar: '_',
            overwrite: true,
            autofix: true,
            blocks: {
                '00': { mask: IMask.MaskedRange, from: 1, to: 31 },
                '00[1]': { mask: IMask.MaskedRange, from: 1, to: 12 },
                '0000': { mask: IMask.MaskedRange, from: 1925, to: new Date().getFullYear() }
            }
        });
    }

    const valorConsulta = document.getElementById('valorConsulta');
    if (valorConsulta) {
        IMask(valorConsulta, {
            mask: Number,
            scale: 2,
            signed: false,
            thousandsSeparator: '',
            padFractionalZeros: true,
            normalizeZeros: true,
            radix: ','
        });
    }

    const dataFluxo = document.getElementById('dataFluxo');
    if (dataFluxo) {
        const hoje = new Date();
        const dataAtual = `${String(hoje.getDate()).padStart(2, '0')}/${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`;
        dataFluxo.value = dataAtual;
        IMask(dataFluxo, {
            mask: '00/00/0000',
            lazy: false,
            placeholderChar: '_',
            overwrite: true,
            autofix: true,
            blocks: {
                '00': { mask: IMask.MaskedRange, from: 1, to: 31 },
                '00[1]': { mask: IMask.MaskedRange, from: 1, to: 12 },
                '0000': { mask: IMask.MaskedRange, from: 1925, to: new Date().getFullYear() }
            }
        });
    }

    const dataInicio = document.getElementById('dataInicio');
    const dataFim = document.getElementById('dataFim');
    if (dataInicio) {
        IMask(dataInicio, {
            mask: '00/00/0000',
            lazy: false,
            placeholderChar: '_',
            overwrite: true,
            autofix: true,
            blocks: {
                '00': { mask: IMask.MaskedRange, from: 1, to: 31 },
                '00[1]': { mask: IMask.MaskedRange, from: 1, to: 12 },
                '0000': { mask: IMask.MaskedRange, from: 1925, to: new Date().getFullYear() }
            }
        });
    }
    if (dataFim) {
        IMask(dataFim, {
            mask: '00/00/0000',
            lazy: false,
            placeholderChar: '_',
            overwrite: true,
            autofix: true,
            blocks: {
                '00': { mask: IMask.MaskedRange, from: 1, to: 31 },
                '00[1]': { mask: IMask.MaskedRange, from: 1, to: 12 },
                '0000': { mask: IMask.MaskedRange, from: 1925, to: new Date().getFullYear() }
            }
        });
    }

    const fluxoDateFilter = document.getElementById('fluxoDateFilter');
    if (fluxoDateFilter) {
        const hoje = new Date();
        const dataAtual = `${String(hoje.getDate()).padStart(2, '0')}/${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`;
        fluxoDateFilter.value = dataAtual;
        IMask(fluxoDateFilter, {
            mask: '00/00/0000',
            lazy: false,
            placeholderChar: '_',
            overwrite: true,
            autofix: true,
            blocks: {
                '00': { mask: IMask.MaskedRange, from: 1, to: 31 },
                '00[1]': { mask: IMask.MaskedRange, from: 1, to: 12 },
                '0000': { mask: IMask.MaskedRange, from: 1925, to: new Date().getFullYear() }
            }
        });
    }

    const filterTipo = document.getElementById('filterTipo');
    const filterCliente = document.getElementById('filterCliente');
    const dateSearch = document.getElementById('dateSearch');
    if (filterTipo) filterTipo.addEventListener('change', carregarAgendamentos);
    if (filterCliente) filterCliente.addEventListener('input', carregarAgendamentos);
    if (dateSearch) dateSearch.addEventListener('input', carregarAgendamentos);

    const filtrarBtn = document.getElementById('filtrarBtn');
    if (filtrarBtn) filtrarBtn.addEventListener('click', abrirModalFiltroPeriodo);

    const openFluxoModalBtn = document.getElementById('openFluxoModalBtn');
    if (openFluxoModalBtn) openFluxoModalBtn.addEventListener('click', () => {
        console.log('[DEBUG] Botão de pesquisa clicado, renderizando fluxo de caixa');
        renderizarFluxoCaixa();
    });
});

window.openTab = function (tabId) {
    const abas = document.querySelectorAll('.tab-content');
    const botoes = document.querySelectorAll('.tab-button');
    abas.forEach(aba => aba.classList.remove('active'));
    botoes.forEach(btn => btn.classList.remove('active'));
    const abaSelecionada = document.getElementById(tabId);
    const botaoSelecionado = document.querySelector(`.tab-button[onclick="openTab('${tabId}')"]`);
    if (abaSelecionada && botaoSelecionado) {
        abaSelecionada.classList.add('active');
        botaoSelecionado.classList.add('active');
        if (tabId === 'fluxoCaixa') carregarFluxoCaixa();
        else if (tabId === 'novoAgendamentos') carregarAgendamentos();
    }
};

function formatarTelefoneExibicao(telefone) {
    const valor = telefone ? telefone.replace(/\D/g, '').substring(0, 11) : '';
    let formatado = '';
    if (valor.length > 0) {
        formatado = '(' + valor.substring(0, 2) + ') ' + valor.substring(2, 7);
        if (valor.length > 6) formatado += '-' + valor.substring(7, 11);
    }
    return formatado || telefone || '';
}

function formatarData(dataString) {
    const [ano, mes, dia] = dataString.split('-');
    return `${dia}/${mes}/${ano}`;
}

function converterDataParaFirebase(dataString) {
    const [dia, mes, ano] = dataString.split('/');
    return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
}

window.openChangePasswordModal = function () {
    const modal = document.getElementById('modal');
    document.getElementById('modalTitle').textContent = 'Alterar Senha';
    document.getElementById('modalContent').innerHTML = `
        <div class="form-group">
            <label for="currentPassword">Senha Atual</label>
            <input type="password" id="currentPassword" placeholder="Digite a senha atual" required>
            <span class="toggle-password" onclick="togglePassword('currentPassword')">👁️</span>
        </div>
        <div class="form-group">
            <label for="newPassword">Nova Senha</label>
            <input type="password" id="newPassword" placeholder="Digite a nova senha" required>
            <span class="toggle-password" onclick="togglePassword('newPassword')">👁️</span>
        </div>
        <div class="modal-buttons">
            <button class="cancel-btn" onclick="closeModal()">Cancelar</button>
            <button class="save-btn">Salvar</button>
        </div>
        <div id="passwordMessage" class="success-message"></div>
    `;
    modal.classList.add('active');
    document.querySelector('.save-btn').addEventListener('click', alterarSenha);
};

window.openLogoutModal = function () {
    const modal = document.getElementById('modal');
    document.getElementById('modalTitle').textContent = 'Confirmar Saída';
    document.getElementById('modalContent').innerHTML = `
        <p>Tem certeza de que deseja sair do sistema?</p>
        <div class="modal-buttons">
            <button class="cancel-btn" onclick="closeModal()">Não</button>
            <button class="confirm-btn" onclick="logout()">Sim</button>
        </div>
    `;
    modal.classList.add('active');
};

window.logout = function () {
    localStorage.removeItem('loggedIn');
    auth.signOut().then(() => {
        console.log('[SUCESSO] Logout realizado com sucesso');
        window.location.href = 'index.html';
    }).catch(error => {
        console.error('[ERRO] Erro ao realizar logout:', error);
        alert('Erro ao sair. Tente novamente.');
    });
};

window.togglePassword = function (inputId) {
    const entrada = document.getElementById(inputId);
    const iconeToggle = entrada.nextElementSibling;
    if (entrada.type === 'password') {
        entrada.type = 'text';
        iconeToggle.textContent = '👁️‍🗨️';
    } else {
        entrada.type = 'password';
        iconeToggle.textContent = '👁️';
    }
};

function alterarSenha() {
    const entradaSenhaAtual = document.getElementById('currentPassword').value;
    const entradaNovaSenha = document.getElementById('newPassword').value;
    const mensagem = document.getElementById('passwordMessage');

    if (!entradaSenhaAtual || !entradaNovaSenha) {
        mensagem.textContent = 'Por favor, preencha todos os campos.';
        mensagem.className = 'error-message';
        return;
    }

    if (entradaSenhaAtual === senhaAtual || entradaSenhaAtual === SENHA_MESTRE) {
        senhaAtual = entradaNovaSenha;
        localStorage.setItem('userPassword', entradaNovaSenha);
        mensagem.textContent = 'Senha alterada com sucesso!';
        mensagem.className = 'success-message';
        setTimeout(() => closeModal(), 1500);
    } else {
        mensagem.textContent = 'Senha atual incorreta.';
        mensagem.className = 'error-message';
    }
}

async function carregarClientes() {
    const listaCliente = document.getElementById('clienteList');
    const entradaBusca = document.getElementById('clientSearch');
    if (!listaCliente || !entradaBusca) return;

    listaCliente.innerHTML = '';
    try {
        const querySnapshot = await getDocs(collection(db, 'clientes'));
        listaClientes = [];
        querySnapshot.forEach((documento) => {
            const dados = documento.data();
            if (!dados.cidade) {
                updateDoc(doc(db, 'clientes', documento.id), { cidade: 'Sem cidade' });
                dados.cidade = 'Sem cidade';
            }
            listaClientes.push({ id: documento.id, ...dados });
        });

        listaClientes.sort((a, b) => a.nome.localeCompare(b.nome));

        function renderizarClientes(filtro = '') {
            listaCliente.innerHTML = '';
            const clientesFiltrados = listaClientes.filter(cliente => 
                cliente.nome.toLowerCase().includes(filtro.toLowerCase())
            );
            clientesFiltrados.forEach(cliente => {
                const item = document.createElement('div');
                item.className = 'list-item';
                const info = document.createElement('div');
                info.className = 'info';
                info.textContent = `${cliente.nome} - ${formatarTelefoneExibicao(cliente.telefone)}`;
                item.appendChild(info);
                const botaoExcluir = document.createElement('button');
                botaoExcluir.className = 'delete-btn';
                botaoExcluir.textContent = 'Excluir';
                botaoExcluir.onclick = (e) => {
                    e.stopPropagation();
                    abrirModalExcluir('cliente', cliente.id, `${cliente.nome} - ${formatarTelefoneExibicao(cliente.telefone)}`);
                };
                item.appendChild(botaoExcluir);
                item.onclick = () => abrirModalCliente(cliente.id, cliente);
                listaCliente.appendChild(item);
            });
        }

        renderizarClientes();
        entradaBusca.addEventListener('input', (e) => renderizarClientes(e.target.value));
    } catch (error) {
        console.error('[ERRO] Erro ao carregar clientes:', error);
        document.getElementById('cadastroMessage').textContent = 'Erro ao carregar clientes: ' + error.message;
        document.getElementById('cadastroMessage').className = 'error-message';
    }
}

function configurarAutocompletarCliente() {
    const entradaCliente = document.getElementById('cliente');
    const listaAutocompletar = document.getElementById('clienteAutocomplete');
    if (!entradaCliente || !listaAutocompletar) return;

    entradaCliente.addEventListener('input', (e) => {
        const filtro = e.target.value.toLowerCase();
        listaAutocompletar.innerHTML = '';
        if (filtro.length === 0) {
            listaAutocompletar.style.display = 'none';
            return;
        }

        const clientesFiltrados = listaClientes.filter(cliente => 
            cliente.nome.toLowerCase().includes(filtro)
        );

        if (clientesFiltrados.length > 0) {
            clientesFiltrados.forEach(cliente => {
                const item = document.createElement('div');
                item.className = 'autocomplete-item';
                item.textContent = `${cliente.nome} - ${formatarTelefoneExibicao(cliente.telefone)}`;
                item.addEventListener('click', () => {
                    entradaCliente.value = cliente.nome;
                    listaAutocompletar.innerHTML = '';
                    listaAutocompletar.style.display = 'none';
                });
                listaAutocompletar.appendChild(item);
            });
            listaAutocompletar.style.display = 'block';
        } else {
            listaAutocompletar.style.display = 'none';
        }
    });

    document.addEventListener('click', (e) => {
        if (!entradaCliente.contains(e.target) && !listaAutocompletar.contains(e.target)) {
            listaAutocompletar.style.display = 'none';
        }
    });
}

async function carregarAgendamentos() {
    const listaAgendamento = document.getElementById('agendamentoList');
    const entradaBuscaData = document.getElementById('dateSearch');
    const filtroTipo = document.getElementById('filterTipo');
    const filtroCliente = document.getElementById('filterCliente');
    if (!listaAgendamento) return;

    listaAgendamento.innerHTML = '';
    try {
        const querySnapshot = await getDocs(collection(db, 'agendamentos'));
        listaAgendamentos = [];
        querySnapshot.forEach((documento) => {
            const dados = documento.data();
            if (!dados.observacao) {
                updateDoc(doc(db, 'agendamentos', documento.id), { observacao: null });
                dados.observacao = null;
            }
            const tipo = dados.tipo || 'Presencial';
            listaAgendamentos.push({ id: documento.id, ...dados, tipo });
        });

        const dataAtual = new Date();
        listaAgendamentos.sort((a, b) => {
            const dataHoraA = new Date(`${a.data}T${a.hora}`);
            const dataHoraB = new Date(`${b.data}T${b.hora}`);
            const ehPassadoA = dataHoraA < dataAtual;
            const ehPassadoB = dataHoraB < dataAtual;

            if (ehPassadoA && !ehPassadoB) return 1;
            if (!ehPassadoA && ehPassadoB) return -1;
            return ehPassadoA ? dataHoraB - dataHoraA : dataHoraA - dataHoraB;
        });

        function renderizarAgendamentos() {
            listaAgendamento.innerHTML = '';
            let agendamentosFiltrados = [...listaAgendamentos];

            const filtroData = entradaBuscaData.value;
            if (filtroData) {
                const filtroNumerico = filtroData.replace(/[^0-9]/g, '');
                const diaFiltro = filtroNumerico.slice(0, 2);
                const mesFiltro = filtroNumerico.slice(2, 4);
                const anoFiltro = filtroNumerico.slice(4, 8);

                agendamentosFiltrados = agendamentosFiltrados.filter(agendamento => {
                    const [ano, mes, dia] = agendamento.data.split('-');
                    const dataFormatada = `${dia}${mes}${ano}`;
                    if (diaFiltro && filtroNumerico.length <= 2) return dia === diaFiltro;
                    if (diaFiltro && mesFiltro && filtroNumerico.length <= 4) return dia === diaFiltro && mes === mesFiltro;
                    if (diaFiltro && mesFiltro && anoFiltro && filtroNumerico.length <= 8) return dia === diaFiltro && mes === mesFiltro && ano === anoFiltro;
                    return true;
                });
            }

            const tipoSelecionado = filtroTipo.value;
            if (tipoSelecionado) {
                agendamentosFiltrados = agendamentosFiltrados.filter(agendamento => agendamento.tipo === tipoSelecionado);
            }

            const clienteFiltro = filtroCliente.value.trim().toLowerCase();
            if (clienteFiltro) {
                agendamentosFiltrados = agendamentosFiltrados.filter(agendamento => agendamento.cliente.toLowerCase().includes(clienteFiltro));
            }

            agendamentosFiltrados.forEach(agendamento => {
                const item = document.createElement('div');
                item.className = 'list-item';
                const info = document.createElement('div');
                info.className = 'info';
                const dataFormatada = formatarData(agendamento.data);
                info.textContent = `${agendamento.cliente} - ${dataFormatada} às ${agendamento.hora}`;
                const acoes = document.createElement('div');
                acoes.className = 'list-item-actions';
                const badgeTipo = document.createElement('span');
                badgeTipo.className = `tipo ${agendamento.tipo.toLowerCase()}`;
                badgeTipo.textContent = agendamento.tipo;
                const botaoExcluir = document.createElement('button');
                botaoExcluir.className = 'delete-btn';
                botaoExcluir.textContent = 'Excluir';
                botaoExcluir.onclick = (e) => {
                    e.stopPropagation();
                    abrirModalExcluir('agendamento', agendamento.id, `${agendamento.cliente} - ${dataFormatada} às ${agendamento.hora} (${agendamento.tipo})`);
                };
                acoes.appendChild(badgeTipo);
                acoes.appendChild(botaoExcluir);
                item.appendChild(info);
                item.appendChild(acoes);
                item.onclick = () => abrirModalEditar(agendamento.id, agendamento);
                listaAgendamento.appendChild(item);
            });
        }

        renderizarAgendamentos();
    } catch (error) {
        console.error('[ERRO] Erro ao carregar agendamentos:', error);
        document.getElementById('agendamentoMessage').textContent = 'Erro ao carregar agendamentos: ' + error.message;
        document.getElementById('agendamentoMessage').className = 'error-message';
    }
}

async function carregarFluxoCaixa() {
    const listaFluxo = document.getElementById('fluxoCaixaList');
    if (!listaFluxo) return;

    listaFluxo.innerHTML = '';
    try {
        const querySnapshot = await getDocs(collection(db, 'fluxoCaixa'));
        listaFluxoCaixa = [];
        querySnapshot.forEach((doc) => {
            const dados = doc.data();
            const tipo = dados.tipo === 'Ganho' || dados.tipo === 'Despesa' ? dados.tipo : (dados.valor >= 0 ? 'Ganho' : 'Despesa');
            listaFluxoCaixa.push({ id: doc.id, ...dados, tipo });
        });

        listaFluxoCaixa.sort((a, b) => new Date(b.data) - new Date(a.data));
        renderizarFluxoCaixa();
        atualizarSaldos();
    } catch (error) {
        console.error('[ERRO] Erro ao carregar fluxo de caixa:', error);
        document.getElementById('fluxoCaixaMessage').textContent = 'Erro ao carregar registros: ' + error.message;
        document.getElementById('fluxoCaixaMessage').className = 'error-message';
    }
}

function renderizarFluxoCaixa() {
    const listaFluxo = document.getElementById('fluxoCaixaList');
    const fluxoDateFilter = document.getElementById('fluxoDateFilter');
    const mensagemFluxo = document.getElementById('fluxoCaixaMessage');
    if (!listaFluxo || !fluxoDateFilter || !mensagemFluxo) return;

    const dataFiltroRaw = fluxoDateFilter.value;
    if (!dataFiltroRaw.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        mensagemFluxo.textContent = 'Por favor, insira uma data válida no formato dd/mm/aaaa.';
        mensagemFluxo.className = 'error-message';
        setTimeout(() => mensagemFluxo.textContent = '', 3000);
        return;
    }

    const dataFiltro = converterDataParaFirebase(dataFiltroRaw);
    const registrosFiltrados = listaFluxoCaixa.filter(item => item.data === dataFiltro);
    listaFluxo.innerHTML = '';

    if (registrosFiltrados.length === 0) {
        listaFluxo.innerHTML = '<p>Nenhuma transação registrada para esta data.</p>';
    } else {
        registrosFiltrados.forEach(item => {
            const elemento = document.createElement('div');
            elemento.className = 'list-item';
            const info = document.createElement('div');
            info.className = 'info';
            const dataFormatada = formatarData(item.data);
            const tipoExibicao = item.tipo || (item.valor >= 0 ? 'Ganho' : 'Despesa');
            info.textContent = `${item.cliente} - R$ ${Math.abs(item.valor).toFixed(2).replace('.', ',')} (${tipoExibicao})`;
            const acoes = document.createElement('div');
            acoes.className = 'list-item-actions';
            const badgeTipo = document.createElement('span');
            badgeTipo.className = `tipo ${tipoExibicao.toLowerCase()}`;
            badgeTipo.textContent = tipoExibicao;
            const botaoExcluir = document.createElement('button');
            botaoExcluir.className = 'delete-btn';
            botaoExcluir.textContent = 'Excluir';
            botaoExcluir.onclick = (e) => {
                e.stopPropagation();
                abrirModalExcluir('fluxoCaixa', item.id, `${item.cliente} - ${dataFormatada} - R$ ${Math.abs(item.valor).toFixed(2).replace('.', ',')} (${tipoExibicao})`);
            };
            acoes.appendChild(badgeTipo);
            acoes.appendChild(botaoExcluir);
            elemento.appendChild(info);
            elemento.appendChild(acoes);
            listaFluxo.appendChild(elemento);
        });
    }
}

function atualizarSaldos() {
    const hoje = new Date().toISOString().split('T')[0];
    const mesAtual = hoje.slice(0, 7);
    const anoAtual = hoje.slice(0, 4);

    const calcularSaldo = (itens) => {
        return itens.reduce((sum, item) => {
            const valor = parseFloat(item.valor || 0);
            return sum + valor;
        }, 0);
    };

    const saldoDia = calcularSaldo(listaFluxoCaixa.filter(item => item.data === hoje));
    const saldoMes = calcularSaldo(listaFluxoCaixa.filter(item => item.data.startsWith(mesAtual)));
    const saldoAno = calcularSaldo(listaFluxoCaixa.filter(item => item.data.startsWith(anoAtual)));

    document.getElementById('saldoDia').textContent = `R$ ${saldoDia.toFixed(2).replace('.', ',')}`;
    document.getElementById('saldoMes').textContent = `R$ ${saldoMes.toFixed(2).replace('.', ',')}`;
    document.getElementById('saldoAno').textContent = `R$ ${saldoAno.toFixed(2).replace('.', ',')}`;
}

function abrirModalFiltroPeriodo() {
    const dataInicioRaw = document.getElementById('dataInicio').value;
    const dataFimRaw = document.getElementById('dataFim').value;
    const filtroTipoElement = document.getElementById('filterFluxoTipo');
    const filtroTipo = filtroTipoElement ? filtroTipoElement.value : 'Todos'; // Garante que pegamos o valor atual
    const mensagem = document.getElementById('fluxoCaixaMessage');

    console.log('[DEBUG] Filtro selecionado:', filtroTipo);
    console.log('[DEBUG] Data início:', dataInicioRaw, 'Data fim:', dataFimRaw);

    if (!dataInicioRaw || !dataFimRaw) {
        mensagem.textContent = 'Por favor, preencha as datas de início e fim.';
        mensagem.className = 'error-message';
        return;
    }

    const dataInicio = converterDataParaFirebase(dataInicioRaw);
    const dataFim = converterDataParaFirebase(dataFimRaw);

    if (new Date(dataInicio) > new Date(dataFim)) {
        mensagem.textContent = 'A data de início deve ser anterior à data de fim.';
        mensagem.className = 'error-message';
        return;
    }

    // Filtra por período
    let registrosFiltrados = listaFluxoCaixa.filter(item => {
        const dataItem = new Date(item.data);
        return dataItem >= new Date(dataInicio) && dataItem <= new Date(dataFim);
    });

    console.log('[DEBUG] Registros após filtro de período:', registrosFiltrados.length);

    // Aplica filtro de tipo
    if (filtroTipo !== 'Todos') {
        registrosFiltrados = registrosFiltrados.filter(item => {
            const tipoExibicao = item.tipo || (item.valor >= 0 ? 'Ganho' : 'Despesa');
            console.log('[DEBUG] Item:', item.cliente, 'Tipo:', tipoExibicao, 'Valor:', item.valor);
            return tipoExibicao === filtroTipo;
        });
    }

    console.log('[DEBUG] Registros após filtro de tipo:', registrosFiltrados.length);

    const modal = document.getElementById('modal');
    document.getElementById('modalTitle').textContent = `Transações de ${dataInicioRaw} a ${dataFimRaw}${filtroTipo !== 'Todos' ? ` (${filtroTipo})` : ''}`;
    let conteudo = '<div class="transaction-list">';

    if (registrosFiltrados.length === 0) {
        conteudo += '<p>Nenhuma transação encontrada neste período.</p>';
    } else {
        registrosFiltrados.forEach(item => {
            const dataFormatada = formatarData(item.data);
            const tipoExibicao = item.tipo || (item.valor >= 0 ? 'Ganho' : 'Despesa');
            conteudo += `
                <div class="transaction-item">
                    <span>${item.cliente} - ${dataFormatada} - R$ ${Math.abs(item.valor).toFixed(2).replace('.', ',')} (${tipoExibicao})</span>
                    <button class="delete-transaction-btn" onclick="window.excluirItem('fluxoCaixa', '${item.id}')">Excluir</button>
                </div>
            `;
        });
    }

    const total = registrosFiltrados.reduce((sum, item) => sum + parseFloat(item.valor || 0), 0);
    conteudo += '</div>';
    conteudo += `<div class="total-container"><p>Total: <span>R$ ${total.toFixed(2).replace('.', ',')}</span></p></div>`;
    conteudo += '<div class="modal-buttons"><button class="cancel-btn" onclick="closeModal()">Fechar</button></div>';
    document.getElementById('modalContent').innerHTML = conteudo;
    modal.classList.add('active');
}

function configurarAutocompletarFluxoCaixa() {
    const entradaCliente = document.getElementById('clienteFluxo');
    const listaAutocompletar = document.getElementById('clienteFluxoAutocomplete');
    const tipoTransacao = document.getElementById('tipoTransacao');
    if (!entradaCliente || !listaAutocompletar || !tipoTransacao) return;

    function atualizarAutocompletar() {
        const filtro = entradaCliente.value.toLowerCase();
        listaAutocompletar.innerHTML = '';
        if (filtro.length === 0) {
            listaAutocompletar.style.display = 'none';
            return;
        }

        if (tipoTransacao.value === 'Ganho') {
            const clientesFiltrados = listaClientes.filter(cliente => 
                cliente.nome.toLowerCase().includes(filtro)
            );

            if (clientesFiltrados.length > 0) {
                clientesFiltrados.forEach(cliente => {
                    const item = document.createElement('div');
                    item.className = 'autocomplete-item';
                    item.textContent = `${cliente.nome} - ${formatarTelefoneExibicao(cliente.telefone)}`;
                    item.addEventListener('click', () => {
                        entradaCliente.value = cliente.nome;
                        listaAutocompletar.innerHTML = '';
                        listaAutocompletar.style.display = 'none';
                    });
                    listaAutocompletar.appendChild(item);
                });
                listaAutocompletar.style.display = 'block';
            } else {
                listaAutocompletar.style.display = 'none';
            }
        } else {
            listaAutocompletar.style.display = 'none';
        }
    }

    entradaCliente.addEventListener('input', atualizarAutocompletar);
    tipoTransacao.addEventListener('change', () => {
        entradaCliente.value = '';
        atualizarAutocompletar();
    });

    document.addEventListener('click', (e) => {
        if (!entradaCliente.contains(e.target) && !listaAutocompletar.contains(e.target)) {
            listaAutocompletar.style.display = 'none';
        }
    });
}

document.getElementById('cadastroForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = document.getElementById('nome').value.trim();
    const telefone = document.getElementById('telefone').value.replace(/\D/g, '').substring(0, 11);
    const cidade = document.getElementById('cidade').value.trim();
    const dataNascimentoRaw = document.getElementById('dataNascimento').value;
    const mensagem = document.getElementById('cadastroMessage');

    let dataNascimento = '';
    if (dataNascimentoRaw.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const [dia, mes, ano] = dataNascimentoRaw.split('/');
        dataNascimento = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    } else {
        mensagem.textContent = 'Por favor, insira a data no formato dd/mm/aaaa.';
        mensagem.className = 'error-message';
        return;
    }

    if (!nome || !telefone || !cidade || !dataNascimento) {
        mensagem.textContent = 'Por favor, preencha todos os campos.';
        mensagem.className = 'error-message';
        return;
    }

    try {
        await addDoc(collection(db, 'clientes'), { nome, telefone, cidade, dataNascimento });
        mensagem.textContent = 'Cliente cadastrado com sucesso!';
        mensagem.className = 'success-message';
        e.target.reset();
        await carregarClientes();
        configurarAutocompletarCliente();
        setTimeout(() => mensagem.textContent = '', 3000);
    } catch (error) {
        console.error('[ERRO] Erro ao cadastrar cliente:', error);
        mensagem.textContent = 'Erro ao cadastrar cliente: ' + error.message;
        mensagem.className = 'error-message';
    }
});

document.getElementById('agendamentoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const cliente = document.getElementById('cliente').value.trim();
    const data = document.getElementById('data').value;
    const hora = document.getElementById('hora').value;
    const tipoAgendamento = document.getElementById('tipoAgendamento').value;
    const mensagem = document.getElementById('agendamentoMessage');

    if (!cliente || !data || !hora || !tipoAgendamento) {
        mensagem.textContent = 'Por favor, preencha todos os campos.';
        mensagem.className = 'error-message';
        return;
    }

    const clienteExiste = listaClientes.some(c => c.nome === cliente);
    if (!clienteExiste) {
        mensagem.textContent = 'Cliente não encontrado.';
        mensagem.className = 'error-message';
        return;
    }

    try {
        const q = query(collection(db, 'agendamentos'), where('data', '==', data), where('hora', '==', hora));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            abrirModalDuplicado();
            return;
        }

        await addDoc(collection(db, 'agendamentos'), { cliente, data, hora, tipo: tipoAgendamento, observacao: null });
        mensagem.textContent = 'Agendamento realizado com sucesso!';
        mensagem.className = 'success-message';
        e.target.reset();
        await carregarAgendamentos();
        setTimeout(() => mensagem.textContent = '', 3000);
    } catch (error) {
        console.error('[ERRO] Erro ao agendar:', error);
        mensagem.textContent = 'Erro ao realizar agendamento: ' + error.message;
        mensagem.className = 'error-message';
    }
});

document.getElementById('fluxoCaixaForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const tipoTransacao = document.getElementById('tipoTransacao').value;
    const cliente = document.getElementById('clienteFluxo').value.trim();
    const valorRaw = document.getElementById('valorConsulta').value.replace(',', '.');
    const dataRaw = document.getElementById('dataFluxo').value;
    const mensagem = document.getElementById('fluxoCaixaMessage');

    let data = '';
    if (dataRaw.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const [dia, mes, ano] = dataRaw.split('/');
        data = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    } else {
        mensagem.textContent = 'Por favor, insira a data no formato dd/mm/aaaa.';
        mensagem.className = 'error-message';
        return;
    }

    const valor = parseFloat(valorRaw);
    if (!tipoTransacao || !cliente || isNaN(valor) || !data) {
        mensagem.textContent = 'Por favor, preencha todos os campos corretamente.';
        mensagem.className = 'error-message';
        return;
    }

    if (tipoTransacao === 'Ganho') {
        const clienteExiste = listaClientes.some(c => c.nome === cliente);
        if (!clienteExiste) {
            mensagem.textContent = 'Cliente não encontrado.';
            mensagem.className = 'error-message';
            return;
        }
    }

    try {
        const valorFinal = tipoTransacao === 'Despesa' ? -valor : valor;
        await addDoc(collection(db, 'fluxoCaixa'), { cliente, valor: valorFinal, data, tipo: tipoTransacao });
        mensagem.textContent = 'Registro adicionado com sucesso!';
        mensagem.className = 'success-message';
        e.target.reset();
        const hoje = new Date();
        const dataAtual = `${String(hoje.getDate()).padStart(2, '0')}/${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`;
        document.getElementById('dataFluxo').value = dataAtual;
        await carregarFluxoCaixa();
        setTimeout(() => mensagem.textContent = '', 3000);
    } catch (error) {
        console.error('[ERRO] Erro ao registrar fluxo de caixa:', error);
        mensagem.textContent = 'Erro ao registrar: ' + error.message;
        mensagem.className = 'error-message';
    }
});

function abrirModalCliente(docId, cliente) {
    const modal = document.getElementById('modal');
    const [ano, mes, dia] = cliente.dataNascimento.split('-');
    const dataFormatada = `${dia}/${mes}/${ano}`;
    document.getElementById('modalTitle').textContent = 'Detalhes do Cliente';
    document.getElementById('modalContent').innerHTML = `
        <div class="form-group">
            <label for="editNome">Nome</label>
            <input type="text" id="editNome" value="${cliente.nome}" required>
        </div>
        <div class="form-group">
            <label for="editTelefone">Telefone</label>
            <input type="tel" id="editTelefone" value="${formatarTelefoneExibicao(cliente.telefone)}" required maxlength="15">
        </div>
        <div class="form-group">
            <label for="editCidade">Cidade</label>
            <input type="text" id="editCidade" value="${cliente.cidade || ''}" required>
        </div>
        <div class="form-group">
            <label for="editDataNascimento">Data de Nascimento</label>
            <input type="text" id="editDataNascimento" value="${dataFormatada}" inputmode="numeric" required>
        </div>
        <div class="modal-buttons">
            <button class="cancel-btn" onclick="closeModal()">Fechar</button>
            <button class="save-btn">Salvar</button>
            <button class="history-btn" id="historyBtn">Histórico</button>
        </div>
    `;
    modal.classList.add('active');

    const editTelefone = document.getElementById('editTelefone');
    if (editTelefone) IMask(editTelefone, { mask: '(00) 90000-0000' });

    const editDataNascimento = document.getElementById('editDataNascimento');
    if (editDataNascimento) {
        IMask(editDataNascimento, {
            mask: '00/00/0000',
            lazy: false,
            placeholderChar: '_',
            overwrite: true,
            autofix: true,
            blocks: {
                '00': { mask: IMask.MaskedRange, from: 1, to: 31 },
                '00[1]': { mask: IMask.MaskedRange, from: 1, to: 12 },
                '0000': { mask: IMask.MaskedRange, from: 1925, to: new Date().getFullYear() }
            }
        });
    }

    document.querySelector('.save-btn').addEventListener('click', () => salvarAlteracoesCliente(docId));
    document.getElementById('historyBtn').addEventListener('click', () => abrirModalHistorico(cliente.nome));
}

async function salvarAlteracoesCliente(docId) {
    const nome = document.getElementById('editNome').value.trim();
    const telefone = document.getElementById('editTelefone').value.replace(/\D/g, '').substring(0, 11);
    const cidade = document.getElementById('editCidade').value.trim();
    const dataNascimentoRaw = document.getElementById('editDataNascimento').value;

    let dataNascimento = '';
    if (dataNascimentoRaw.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const [dia, mes, ano] = dataNascimentoRaw.split('/');
        dataNascimento = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    } else {
        alert('Por favor, insira a data no formato dd/mm/aaaa.');
        return;
    }

    if (!nome || !telefone || !cidade || !dataNascimento) {
        alert('Por favor, preencha todos os campos.');
        return;
    }

    try {
        await updateDoc(doc(db, 'clientes', docId), { nome, telefone, cidade, dataNascimento });
        closeModal();
        await carregarClientes();
        configurarAutocompletarCliente();
    } catch (error) {
        console.error('[ERRO] Erro ao atualizar cliente:', error);
        alert('Erro ao salvar alterações: ' + error.message);
    }
}

function abrirModalEditar(id, agendamento) {
    const modal = document.getElementById('modal');
    document.getElementById('modalTitle').textContent = 'Remarcar Agendamento';
    document.getElementById('modalContent').innerHTML = `
        <div class="form-group">
            <label>Nova Data</label>
            <input type="date" id="modalData" value="${agendamento.data}">
        </div>
        <div class="form-group">
            <label>Nova Hora</label>
            <input type="time" id="modalHora" value="${agendamento.hora}">
        </div>
        <div class="form-group">
            <label>Tipo de Agendamento</label>
            <select id="modalTipo" required>
                <option value="Online" ${agendamento.tipo === 'Online' ? 'selected' : ''}>Online</option>
                <option value="Presencial" ${agendamento.tipo === 'Presencial' ? 'selected' : ''}>Presencial</option>
            </select>
        </div>
        <div class="form-group">
            <label for="observacao">Observação do Atendimento</label>
            <textarea id="observacao" placeholder="Digite suas observações aqui" rows="4">${agendamento.observacao || ''}</textarea>
        </div>
        <div class="modal-buttons">
            <button class="cancel-btn" onclick="closeModal()">Cancelar</button>
            <button class="save-btn">Salvar</button>
        </div>
    `;
    modal.classList.add('active');
    document.querySelector('.save-btn').addEventListener('click', () => salvarAlteracoes(id, agendamento));
}

async function salvarAlteracoes(id, agendamento) {
    const novaData = document.getElementById('modalData').value;
    const novaHora = document.getElementById('modalHora').value;
    const novoTipo = document.getElementById('modalTipo').value;
    const observacao = document.getElementById('observacao').value.trim();

    try {
        const dadosAtualizados = {};
        if (novaData) dadosAtualizados.data = novaData;
        if (novaHora) dadosAtualizados.hora = novaHora;
        if (novoTipo) dadosAtualizados.tipo = novoTipo;
        if (observacao || observacao === '') dadosAtualizados.observacao = observacao;

        if (Object.keys(dadosAtualizados).length === 0) {
            alert('Nenhuma alteração foi feita.');
            return;
        }

        if (observacao) {
            const referenciaAgendamento = doc(db, 'agendamentos', id);
            const snapshotAgendamento = await getDoc(referenciaAgendamento);
            const dadosAtuais = snapshotAgendamento.data();
            const dataUsar = novaData || dadosAtuais.data;
            const horaUsar = novaHora || dadosAtuais.hora;

            const consultaHistorico = query(
                collection(db, 'historico'),
                where('cliente', '==', agendamento.cliente),
                where('data', '==', dataUsar),
                where('hora', '==', horaUsar)
            );
            const snapshotHistorico = await getDocs(consultaHistorico);

            const documentoHistorico = snapshotHistorico.docs[0];
            if (documentoHistorico) {
                await updateDoc(doc(db, 'historico', documentoHistorico.id), { observacao });
            } else {
                await addDoc(collection(db, 'historico'), {
                    cliente: agendamento.cliente,
                    data: dataUsar,
                    hora: horaUsar,
                    tipo: novoTipo || agendamento.tipo,
                    observacao
                });
            }
        }

        await updateDoc(doc(db, 'agendamentos', id), dadosAtualizados);
        closeModal();
        await carregarAgendamentos();
        document.getElementById('agendamentoMessage').textContent = 'Agendamento atualizado com sucesso!';
        document.getElementById('agendamentoMessage').className = 'success-message';
        setTimeout(() => document.getElementById('agendamentoMessage').textContent = '', 3000);
    } catch (error) {
        console.error('[ERRO] Erro ao salvar alterações do agendamento:', error);
        alert('Erro ao salvar alterações: ' + error.message);
    }
}

function abrirModalDuplicado() {
    const modal = document.getElementById('modal');
    document.getElementById('modalTitle').textContent = 'Horário Ocupado';
    document.getElementById('modalContent').innerHTML = `
        <p>Este horário já está ocupado. Deseja continuar mesmo assim?</p>
        <div class="modal-buttons">
            <button class="cancel-btn" onclick="closeModal()">Não</button>
            <button class="confirm-btn" onclick="forcarAgendamento()">Sim</button>
        </div>
    `;
    modal.classList.add('active');
}

async function forcarAgendamento() {
    const cliente = document.getElementById('cliente').value.trim();
    const data = document.getElementById('data').value;
    const hora = document.getElementById('hora').value;
    const tipoAgendamento = document.getElementById('tipoAgendamento').value;
    const mensagem = document.getElementById('agendamentoMessage');

    try {
        await addDoc(collection(db, 'agendamentos'), { cliente, data, hora, tipo: tipoAgendamento, observacao: null });
        mensagem.textContent = 'Agendamento forçado com sucesso!';
        mensagem.className = 'success-message';
        document.getElementById('agendamentoForm').reset();
        await carregarAgendamentos();
        closeModal();
        setTimeout(() => mensagem.textContent = '', 3000);
    } catch (error) {
        console.error('[ERRO] Erro ao forçar agendamento:', error);
        mensagem.textContent = 'Erro ao forçar agendamento: ' + error.message;
        mensagem.className = 'error-message';
    }
}

function abrirModalExcluir(tipo, id, descricao) {
    const modal = document.getElementById('modal');
    document.getElementById('modalTitle').textContent = 'Confirmar Exclusão';
    document.getElementById('modalContent').innerHTML = `
        <p>Tem certeza de que deseja excluir: <br><strong>${descricao}</strong>?</p>
        <div class="modal-buttons">
            <button class="cancel-btn" onclick="closeModal()">Não</button>
            <button class="confirm-btn" onclick="window.excluirItem('${tipo}', '${id}')">Sim</button>
        </div>
    `;
    modal.classList.add('active');
}

window.excluirItem = async function (tipo, id) {
    try {
        let colecao;
        let mensagemElemento;
        let carregarFuncao;

        switch (tipo) {
            case 'cliente':
                colecao = 'clientes';
                mensagemElemento = 'cadastroMessage';
                carregarFuncao = carregarClientes;
                break;
            case 'agendamento':
                colecao = 'agendamentos';
                mensagemElemento = 'agendamentoMessage';
                carregarFuncao = carregarAgendamentos;
                break;
            case 'fluxoCaixa':
                colecao = 'fluxoCaixa';
                mensagemElemento = 'fluxoCaixaMessage';
                carregarFuncao = carregarFluxoCaixa;
                break;
            default:
                throw new Error('Tipo de item inválido');
        }

        await deleteDoc(doc(db, colecao, id));
        closeModal();
        await carregarFuncao();
        const mensagem = document.getElementById(mensagemElemento);
        mensagem.textContent = 'Item excluído com sucesso!';
        mensagem.className = 'success-message';
        setTimeout(() => mensagem.textContent = '', 3000);
    } catch (error) {
        console.error(`[ERRO] Erro ao excluir ${tipo}:`, error);
        alert(`Erro ao excluir ${tipo}: ` + error.message);
    }
};

async function abrirModalHistorico(nomeCliente) {
    const modal = document.getElementById('modal');
    document.getElementById('modalTitle').textContent = `Histórico de ${nomeCliente}`;
    let conteudo = '<div class="history-list">';

    try {
        const q = query(collection(db, 'historico'), where('cliente', '==', nomeCliente));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            conteudo += '<p>Nenhum histórico encontrado.</p>';
        } else {
            const historicoPorData = {};
            querySnapshot.forEach((doc) => {
                const dados = doc.data();
                const dataFormatada = formatarData(dados.data);
                if (!historicoPorData[dataFormatada]) historicoPorData[dataFormatada] = [];
                historicoPorData[dataFormatada].push({ id: doc.id, ...dados });
            });

            for (const data in historicoPorData) {
                conteudo += `<div class="history-date">${data}</div>`;
                historicoPorData[data].forEach(item => {
                    conteudo += `
                        <div class="history-item">
                            <span>${item.hora} - ${item.tipo} - ${item.observacao || 'Sem observação'}</span>
                            <button class="delete-history-btn" onclick="excluirHistorico('${item.id}')">Excluir</button>
                        </div>
                    `;
                });
            }
        }
        conteudo += '</div>';
        conteudo += '<div class="modal-buttons"><button class="cancel-btn" onclick="closeModal()">Fechar</button></div>';
        document.getElementById('modalContent').innerHTML = conteudo;
        modal.classList.add('active');
    } catch (error) {
        console.error('[ERRO] Erro ao carregar histórico:', error);
        document.getElementById('modalContent').innerHTML = `<p>Erro ao carregar histórico: ${error.message}</p>`;
    }
}

async function excluirHistorico(id) {
    try {
        await deleteDoc(doc(db, 'historico', id));
        const nomeCliente = document.getElementById('modalTitle').textContent.replace('Histórico de ', '');
        closeModal();
        abrirModalHistorico(nomeCliente);
    } catch (error) {
        console.error('[ERRO] Erro ao excluir histórico:', error);
        alert('Erro ao excluir histórico: ' + error.message);
    }
}

window.closeModal = function () {
    document.getElementById('modal').classList.remove('active');
};
