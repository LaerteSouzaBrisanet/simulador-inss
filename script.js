let acertos = 0, erros = 0, perguntasAtivas = [], modoMissao = "CE";
let respostas = {}, duvidas = {}, cronometro;

window.onload = () => {
    const seletor = document.getElementById('seletor-topico');
    if (typeof bancoQuestoes !== 'undefined') {
        Object.keys(bancoQuestoes).forEach(t => {
            let opt = document.createElement('option');
            opt.value = "CE|" + t; opt.innerText = `🛡️ ${t}`; seletor.appendChild(opt);
        });
    }
    if (typeof bancoQuestoesLacunas !== 'undefined') {
        Object.keys(bancoQuestoesLacunas).forEach(t => {
            let opt = document.createElement('option');
            opt.value = "LAC|" + t; opt.innerText = `✍️ ${t}`; seletor.appendChild(opt);
        });
    }
};

function iniciarMissao() {
    const selecao = document.getElementById('seletor-topico').value;
    const tempoMinutos = parseInt(document.getElementById('seletor-tempo').value);
    
    if(selecao === "GERAL") {
        modoMissao = "CE"; perguntasAtivas = [];
        Object.keys(bancoQuestoes).forEach(t => perguntasAtivas.push(...bancoQuestoes[t]));
    } else {
        const partes = selecao.split("|");
        modoMissao = (partes[0] === "LAC") ? "LACUNA" : "CE";
        perguntasAtivas = (modoMissao === "LACUNA") ? [...bancoQuestoesLacunas[partes[1]]] : [...bancoQuestoes[partes[1]]];
    }
    
    perguntasAtivas.sort(() => Math.random() - 0.5);
    document.getElementById('tela-preparacao').style.display = 'none';
    document.getElementById('topo').style.display = 'block';
    document.getElementById('mapa').style.display = 'flex';
    document.getElementById('quiz-cont').style.display = 'block';
    document.getElementById('rodape').style.display = 'block';
    
    renderizar();
    iniciarCronometro(tempoMinutos);
    window.addEventListener('scroll', rastrearScrollManual);
}

function iniciarCronometro(minutos) {
    if(minutos > 900) { document.getElementById('tempo').innerText = "LIVRE"; return; }
    let segundos = minutos * 60;
    cronometro = setInterval(() => {
        let m = Math.floor(segundos / 60), s = segundos % 60;
        document.getElementById('tempo').innerText = `${m}:${s < 10 ? '0'+s : s}`;
        if(segundos <= 0) { clearInterval(cronometro); alert("TEMPO ESGOTADO!"); confirmarEntrega(); }
        segundos--;
    }, 1000);
}

function renderizar() {
    const box = document.getElementById('quiz-box'); box.innerHTML = '';
    const mapa = document.getElementById('mapa'); mapa.innerHTML = '';
    perguntasAtivas.forEach((q, i) => {
        const card = document.createElement('div');
        card.className = 'pergunta-card'; card.id = `card-${i}`;
        let interacao = modoMissao === "CE" ? 
            `<button class="btn-opcao" id="opt-${i}-C" onclick="selecionar(${i}, 'C')">Certo</button>
             <button class="btn-opcao" id="opt-${i}-E" onclick="selecionar(${i}, 'E')">Errado</button>` :
            `<input type="text" class="input-lacuna" placeholder="Sua resposta..." oninput="selecionar(${i}, this.value)">`;
        
        card.innerHTML = `<small style="color:var(--primary); font-weight:700;">Missão #${i+1}</small>
                          <p style="font-weight:600; margin:18px 0; line-height:1.6; font-size:1.05rem;">${q.pergunta}</p>
                          ${interacao}
                          <button class="btn-duvida" id="duvida-${i}" onclick="marcarDuvida(${i})">🤔 MARCAR DÚVIDA PARA REVISÃO</button>
                          <div id="fb-${i}" class="feedback"></div>`;
        box.appendChild(card);
        const nav = document.createElement('button');
        nav.className = 'nav-item'; nav.id = `nav-${i}`; nav.innerText = i + 1;
        nav.onclick = () => window.scrollTo({top: document.getElementById(`card-${i}`).offsetTop - 120, behavior:'smooth'});
        mapa.appendChild(nav);
    });
}

function selecionar(idx, val) {
    respostas[idx] = val;
    if(modoMissao === 'CE') {
        const card = document.getElementById(`card-${idx}`);
        card.querySelectorAll('.btn-opcao').forEach(b => b.classList.remove('marcado-azul'));
        document.getElementById(`opt-${idx}-${val}`).classList.add('marcado-azul');
    }
    document.getElementById(`nav-${idx}`).style.border = "2px solid var(--info)";
    document.getElementById('cont-progresso').innerText = `${Object.keys(respostas).length}/${perguntasAtivas.length}`;
}

function marcarDuvida(idx) {
    const btn = document.getElementById(`duvida-${idx}`);
    if (duvidas[idx]) { delete duvidas[idx]; btn.classList.remove('marcado-duvida'); }
    else { duvidas[idx] = true; btn.classList.add('marcado-duvida'); }
}

function rastrearScrollManual() {
    perguntasAtivas.forEach((_, i) => {
        const card = document.getElementById(`card-${i}`);
        const navBtn = document.getElementById(`nav-${i}`);
        if (!card || !navBtn) return;
        const rect = card.getBoundingClientRect();
        if (rect.top <= 250 && rect.bottom >= 250) {
            navBtn.classList.add('foco-atual'); navBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else { navBtn.classList.remove('foco-atual'); }
    });
}

function confirmarEntrega() {
    clearInterval(cronometro);
    if(!confirm("Encerrar missão e ver análise de desempenho?")) return;
    acertos = 0; erros = 0;
    const revisaoCont = document.getElementById('revisao-container');
    revisaoCont.innerHTML = `
        <div class="aba-revisao" style="border-color:var(--danger)"><div class="aba-titulo">❌ BANCO DE ERROS</div><div id="lista-erros"></div></div>
        <div class="aba-revisao" style="border-color:var(--warning)"><div class="aba-titulo">🤔 BANCO DE DÚVIDAS</div><div id="lista-duvidas"></div></div>
        <div class="aba-revisao" style="border-color:var(--primary)"><div class="aba-titulo">✅ BANCO DE ACERTOS</div><div id="lista-acertos"></div></div>
    `;

    perguntasAtivas.forEach((q, i) => {
        const r = (respostas[i] || "").trim();
        const n = document.getElementById(`nav-${i}`);
        let ok = (modoMissao === 'CE') ? (r === q.resposta) : (r.toLowerCase() === q.resposta.toLowerCase());
        
        const itemHtml = `<div class="revisao-item ${ok ? 'cor-acerto' : 'cor-erro'}">
            <b>Questão #${i+1}:</b> ${q.pergunta}<br>
            <small style="color:var(--primary)">Gabarito: ${q.resposta}</small> | <small>Sua Resposta: ${r || "Em branco"}</small>
            <p style="margin-top:10px; font-size:0.85rem; opacity:0.9; background:rgba(0,0,0,0.2); padding:10px; border-radius:8px;">${q.explicacao}</p>
        </div>`;

        if(ok && r !== "") { acertos++; n.className = "nav-item certa"; document.getElementById('lista-acertos').innerHTML += itemHtml; }
        else { erros++; n.className = "nav-item errada"; document.getElementById('lista-erros').innerHTML += itemHtml; }
        if(duvidas[i]) { document.getElementById('lista-duvidas').innerHTML += itemHtml.replace('revisao-item', 'revisao-item cor-duvida'); }
    });

    document.getElementById('quiz-box').style.display = 'none';
    document.getElementById('rodape').style.display = 'none';
    document.getElementById('resultado-final').style.display = 'block';
    document.getElementById('score-texto').innerText = `Score Líquido: ${acertos - erros}`;
    document.getElementById('cont-liquido').innerText = acertos - erros;
    window.scrollTo(0,0);
}