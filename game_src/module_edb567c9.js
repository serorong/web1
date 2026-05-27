/* 퀴즈 시스템 — 센터 훈련 퀴즈 + 최종 퀴즈 + 세종청사 꽃 퀴즈 */
window.QUIZ = (() => {

const $ = id => document.getElementById(id);

function openTraining(quizKey, onDone){
  const q = window.DATA.TRAIN_QUIZ[quizKey];
  if(!q){ if(onDone) onDone(false); return; }
  $("quiz-title").textContent = `📚 스킬 훈련 — ${q.target} Lv${q.lvl}: ${q.skill}`;
  $("quiz-q").textContent = q.q;
  $("quiz-meta").textContent = `통과하면 ${q.target}이(가) Lv${q.lvl} [${q.skill}] 스킬을 배웁니다.`;
  renderOptions(q, (ok)=> {
    setTimeout(()=> {
      window.UI.closeModal("quiz-modal");
      onDone && onDone(ok, q);
    }, 1200);
  });
  window.UI.openModal("quiz-modal");
}

function openSetQuiz(key, onDone){
  const q = window.DATA.SET_QUIZ[key];
  if(!q){ if(onDone) onDone(false); return; }
  $("quiz-title").textContent = "🗳️ 퀴즈";
  $("quiz-q").textContent = q.q;
  $("quiz-meta").textContent = "";
  renderOptions(q, (ok)=> {
    setTimeout(()=> {
      window.UI.closeModal("quiz-modal");
      onDone && onDone(ok, q);
    }, 1200);
  });
  window.UI.openModal("quiz-modal");
}

function renderOptions(q, onResult){
  const c = $("quiz-opts");
  c.innerHTML = "";
  const correctText = q.opts[q.a];
  const shuffled = [...q.opts];
  for(let i = shuffled.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const correctIdx = shuffled.indexOf(correctText);
  let done = false;
  shuffled.forEach((label, i) => {
    const btn = document.createElement("button");
    btn.className = "option";
    btn.textContent = label;
    btn.onclick = () => {
      if(done) return; done = true;
      if(i === correctIdx){
        btn.classList.add("correct");
        if(window.AUDIO) window.AUDIO.playCollectSFX();
        setTimeout(()=> onResult(true), 600);
      } else {
        btn.classList.add("wrong");
        if(window.AUDIO) window.AUDIO.playWrongSFX();
        c.children[correctIdx].classList.add("correct");
        setTimeout(()=> onResult(false), 900);
      }
    };
    c.appendChild(btn);
  });
}

// === 최종 퀴즈 ===
function openFinal(onDone){
  const body = $("final-quiz-body");
  const Q = window.DATA.FINAL_QUIZ;
  let idx = 0; let correct = 0;

  function step(){
    if(idx >= Q.length){
      body.innerHTML = `
        <div style="margin-top:14px; font-size:18px; text-align:center;">
          <b>결과: ${correct} / ${Q.length}</b>
        </div>
        <div style="margin-top:8px; text-align:center;">
          ${correct === Q.length ? "🎉 모든 문항 정답! 신의국이 완성되었어요!" : "더 공부해서 다시 도전해보세요!"}
        </div>
        <div style="margin-top:16px; text-align:center;">
          <button class="option" id="final-close">${correct === Q.length ? "엔딩 보기" : "닫기"}</button>
        </div>
      `;
      $("final-close").onclick = () => {
        window.UI.closeModal("final-quiz-modal");
        onDone && onDone(correct === Q.length);
      };
      return;
    }
    const q = Q[idx];
    body.innerHTML = `
      <div style="margin:14px 0; font-size:13px; color:#5a4a30;">문항 ${idx+1} / ${Q.length}</div>
      <div class="q">${q.q}</div>
      <div class="options"></div>
    `;
    const opts = body.querySelector(".options");
    const correctText = q.opts[q.a];
    const shuffled = [...q.opts];
    for(let i = shuffled.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const correctIdx = shuffled.indexOf(correctText);
    let answered = false;
    shuffled.forEach((label, i) => {
      const btn = document.createElement("button");
      btn.className = "option";
      btn.textContent = label;
      btn.onclick = () => {
        if(answered) return; answered = true;
        if(i === correctIdx){
          btn.classList.add("correct");
          if(window.AUDIO) window.AUDIO.playCollectSFX();
          correct++;
        } else {
          btn.classList.add("wrong");
          if(window.AUDIO) window.AUDIO.playWrongSFX();
          opts.children[correctIdx].classList.add("correct");
        }
        setTimeout(()=>{ idx++; step(); }, 900);
      };
      opts.appendChild(btn);
    });
  }

  step();
  window.UI.openModal("final-quiz-modal");
}

// === 세종청사 꽃 도감 퀴즈 (16문항) ===
function openSejongQuiz(onDone){
  const body = $("sejong-quiz-body");
  if(!body){ if(onDone) onDone(false); return; }
  const Q = window.DATA.SEJONG_QUIZ;
  let idx = 0; let correct = 0; let wrongCount = 0;

  function step(){
    if(idx >= Q.length){
      const allCorrect = (correct === Q.length);
      body.innerHTML = `
        <div style="margin-top:14px; font-size:20px; text-align:center;">
          <b>${allCorrect ? "🎉" : "😢"} 결과: ${correct} / ${Q.length}</b>
        </div>
        <div style="margin-top:8px; text-align:center; font-size:14px;">
          ${allCorrect
            ? "16개 전부 정답! 청사이가 기뻐하고 있어요!"
            : `${Q.length - correct}개 틀렸어요. 다시 도전해보세요!`}
        </div>
        <div style="margin-top:16px; text-align:center;">
          <button class="option" id="sejong-close">${allCorrect ? "청사이 획득!" : "닫기"}</button>
        </div>
      `;
      $("sejong-close").onclick = () => {
        window.UI.closeModal("sejong-quiz-modal");
        onDone && onDone(allCorrect);
      };
      return;
    }
    const q = Q[idx];
    body.innerHTML = `
      <div style="margin:10px 0; font-size:13px; color:#5a4a30;">
        꽃 도감 퀴즈 ${idx+1} / ${Q.length}
        <span style="float:right; color:#c84040;">틀린 문제: ${wrongCount}</span>
      </div>
      <div class="q" style="background:#fffaf0; padding:14px; border-radius:6px; border:2px solid #2a1a05; font-size:15px; margin-bottom:12px;">${q.q}</div>
      <div class="options" id="sejong-opts"></div>
    `;
    const opts = $("sejong-opts");
    const correctText = q.opts[q.a];
    const shuffled = [...q.opts];
    for(let i = shuffled.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const correctIdx = shuffled.indexOf(correctText);
    let answered = false;
    shuffled.forEach((label, i) => {
      const btn = document.createElement("button");
      btn.className = "option";
      btn.textContent = label;
      btn.onclick = () => {
        if(answered) return; answered = true;
        if(i === correctIdx){
          btn.classList.add("correct");
          if(window.AUDIO) window.AUDIO.playCollectSFX();
          correct++;
        } else {
          btn.classList.add("wrong");
          if(window.AUDIO) window.AUDIO.playWrongSFX();
          opts.children[correctIdx].classList.add("correct");
          wrongCount++;
        }
        setTimeout(()=>{ idx++; step(); }, 1000);
      };
      opts.appendChild(btn);
    });
  }

  step();
  window.UI.openModal("sejong-quiz-modal");
}

// === 센터 메뉴 ===
function openCenterMenu(onClose){
  const G = window.Game.getState();
  const skills = G.skills;
  const choices = [];
  const trainable = [
    { owner:"국이", id:2 },
    { owner:"행이", id:3 },
    { owner:"법이", id:4 }
  ];
  trainable.forEach(({owner, id}) => {
    if(!G.dex.includes(id)){
      choices.push({ label:`${owner} (아직 만나지 못함)`, disabled:true });
      return;
    }
    const lv = skills[owner] || 1;
    const next = lv + 1;
    const key = `${owner}${next}`;
    const q = window.DATA.TRAIN_QUIZ[key];
    if(q){
      choices.push({
        label:`${owner} Lv${next}: ${q.skill} 훈련하기`,
        action: () => {
          openTraining(key, (ok)=> {
            if(ok){
              window.Game.learnSkill(owner, next);
              window.UI.toast(`${owner}가 Lv${next} [${q.skill}] 스킬을 배웠어요!`);
            } else {
              window.UI.toast("아직 스킬을 배우지 못했어요. 다시 도전해보세요!");
            }
            onClose && onClose();
          });
        }
      });
    } else {
      choices.push({ label:`${owner} 최대 레벨 도달!`, disabled:true });
    }
  });
  if(G.flags.metHyeon && !G.flags.finalDone){
    choices.push({
      label:"🏛️ 최종 퀴즈: 삼권 견제 다이어그램",
      action: () => {
        openFinal((ok)=> {
          if(ok){ window.Game.completeFinal(); }
          onClose && onClose();
        });
      }
    });
  }
  choices.push({
    label:"🌿 포켓몬 회복하기",
    action: () => {
      window.Game.healAll();
      window.UI.toast("모든 포켓몬이 풀체로 회복되었어요!");
      onClose && onClose();
    }
  });
  choices.push({ label:"닫기", action: ()=> onClose && onClose() });
  showChoiceDialog("센터 간호사", "어떤 도움이 필요하세요?", choices);
}

function showChoiceDialog(name, question, choices){
  $("quiz-title").textContent = name;
  $("quiz-q").textContent = question;
  $("quiz-meta").textContent = "";
  const c = $("quiz-opts");
  c.innerHTML = "";
  choices.forEach(ch => {
    const btn = document.createElement("button");
    btn.className = "option";
    btn.textContent = ch.label;
    btn.disabled = !!ch.disabled;
    if(ch.disabled) btn.style.opacity = "0.5";
    btn.onclick = () => {
      window.UI.closeModal("quiz-modal");
      if(ch.action) ch.action();
    };
    c.appendChild(btn);
  });
  window.UI.openModal("quiz-modal");
}

return { openTraining, openSetQuiz, openFinal, openSejongQuiz, openCenterMenu, showChoiceDialog };
})();
