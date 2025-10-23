// 遊戲狀態
const gameState = {
    currentScreen: 'main-menu',
    difficulty: 'easy',
    round: 1,
    player: {
        health: 1000,
        maxHealth: 1000,
        skills: [],
        effects: []
    },
    enemy: {
        health: 1000,
        maxHealth: 1000,
        skill: null,
        effects: []
    },
    battleStats: {
        wins: 0,
        losses: 0
    },
    usedSkillThisTurn: false,
    usedAttackThisTurn: false,
    enemyStunned: false,
    playerStunned: false
};

// 技能數據庫
const skills = [
    {
        id: 1,
        name: "火球術",
        damage: 150,
        heal: 0,
        rarity: 1,
        type: "active",
        effect: null,
        description: "發射火球造成150點傷害",
        used: false
    },
    {
        id: 2,
        name: "治療術",
        damage: 0,
        heal: 120,
        rarity: 1,
        type: "active",
        effect: null,
        description: "恢復120點生命值",
        used: false
    },
    {
        id: 3,
        name: "閃電鏈",
        damage: 180,
        heal: 0,
        rarity: 2,
        type: "active",
        effect: { type: "stun", chance: 30, duration: 1 },
        description: "造成180點傷害，30%機率暈眩敵人1回合",
        used: false
    },
    {
        id: 4,
        name: "毒液噴射",
        damage: 120,
        heal: 0,
        rarity: 2,
        type: "active",
        effect: { type: "poison", damage: 50, duration: 3 },
        description: "造成120點傷害，使敵人中毒3回合，每回合造成50點傷害",
        used: false
    },
    {
        id: 5,
        name: "吸血術",
        damage: 130,
        heal: 0,
        rarity: 3,
        type: "active",
        effect: { type: "vampire", percent: 50 },
        description: "造成130點傷害，並吸收50%傷害值的生命",
        used: false
    },
    {
        id: 6,
        name: "戰士之力",
        damage: 0,
        heal: 0,
        rarity: 2,
        type: "passive",
        effect: { type: "damage_boost", value: 10 },
        description: "被動：增加所有傷害10%",
        used: false
    },
    {
        id: 7,
        name: "活力提升",
        damage: 0,
        heal: 0,
        rarity: 2,
        type: "passive",
        effect: { type: "heal_boost", value: 15 },
        description: "被動：增加所有治療效果15%",
        used: false
    },
    {
        id: 8,
        name: "龍之怒",
        damage: 350,
        heal: 0,
        rarity: 4,
        type: "ultimate",
        effect: { type: "stun", duration: 2 },
        description: "限定技：造成350點傷害並暈眩敵人2回合（每場戰鬥只能使用一次）",
        used: false
    },
    {
        id: 9,
        name: "鳳凰重生",
        damage: 0,
        heal: 500,
        rarity: 4,
        type: "ultimate",
        effect: null,
        description: "限定技：恢復500點生命值（每場戰鬥只能使用一次）",
        used: false
    }
];

// 初始化遊戲
function initGame() {
    // 載入保存的數據
    const savedData = localStorage.getItem('fightingPVPSave');
    if (savedData) {
        const parsed = JSON.parse(savedData);
        Object.assign(gameState.battleStats, parsed.battleStats);
        if (parsed.player && parsed.player.skills) {
            gameState.player.skills = parsed.player.skills;
        }
    }
    
    // 如果沒有技能，給玩家一個初始技能
    if (gameState.player.skills.length === 0) {
        const startingSkills = skills.filter(skill => skill.rarity === 1 && skill.type === "active");
        const randomSkill = startingSkills[Math.floor(Math.random() * startingSkills.length)];
        gameState.player.skills.push({...randomSkill, count: 1});
    }
    
    updateUI();
}

// 切換屏幕
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    gameState.currentScreen = screenId;
    updateUI();
}

// 開始遊戲
function startGame(difficulty) {
    gameState.difficulty = difficulty;
    gameState.round = 1;
    gameState.player.health = 1000;
    gameState.player.maxHealth = 1000;
    gameState.player.effects = [];
    gameState.enemy.health = difficulty === 'hell' ? 1500 : 1000;
    gameState.enemy.maxHealth = difficulty === 'hell' ? 1500 : 1000;
    gameState.enemy.effects = [];
    gameState.usedSkillThisTurn = false;
    gameState.usedAttackThisTurn = false;
    gameState.enemyStunned = false;
    gameState.playerStunned = false;
    
    // 重置限定技能使用狀態
    gameState.player.skills.forEach(skill => {
        if (skill.type === "ultimate") {
            skill.used = false;
        }
    });
    
    // 為敵人隨機選擇技能
    const availableSkills = skills.filter(skill => 
        skill.type === "active" && 
        (difficulty === 'easy' ? skill.rarity <= 3 : skill.rarity <= 4)
    );
    gameState.enemy.skill = {...availableSkills[Math.floor(Math.random() * availableSkills.length)]};
    
    showScreen('battle-screen');
    addBattleLog("戰鬥開始！敵人獲得了技能: " + gameState.enemy.skill.name);
    updateUI();
}

// 玩家行動
function playerAction(action) {
    if (gameState.playerStunned) {
        addBattleLog("你被暈眩了，無法行動！");
        enemyTurn();
        return;
    }
    
    switch(action) {
        case 'attack':
            if (gameState.usedAttackThisTurn) {
                addBattleLog("本回合已經使用過普通攻擊！");
                return;
            }
            performAttack();
            gameState.usedAttackThisTurn = true;
            break;
            
        case 'skill':
            if (gameState.usedSkillThisTurn) {
                addBattleLog("本回合已經使用過技能！");
                return;
            }
            showSkillSelection();
            break;
            
        case 'ultimate':
            if (gameState.usedSkillThisTurn) {
                addBattleLog("本回合已經使用過技能！");
                return;
            }
            showUltimateSelection();
            break;
            
        case 'heal':
            performHeal();
            break;
    }
    
    updateUI();
}

// 執行普通攻擊
function performAttack() {
    const baseDamage = Math.floor(Math.random() * 256);
    const damage = calculateDamage(baseDamage, true);
    gameState.enemy.health -= damage;
    
    addBattleLog(`你進行普通攻擊，造成 ${damage} 點傷害！`);
    
    // 檢查暴擊（如果有相關被動技能）
    const criticalStriker = gameState.player.skills.find(skill => 
        skill.effect && skill.effect.type === "critical"
    );
    if (criticalStriker && Math.random() < 0.2) {
        const critDamage = damage;
        gameState.enemy.health -= critDamage;
        addBattleLog(`✨ 暴擊！額外造成 ${critDamage} 點傷害！`);
    }
    
    if (checkBattleEnd()) return;
    
    updateUI();
}

// 執行治療
function performHeal() {
    const baseHeal = Math.floor(Math.random() * 256);
    const healBoost = getHealBoost();
    const actualHeal = Math.min(baseHeal + healBoost, gameState.player.maxHealth - gameState.player.health);
    gameState.player.health += actualHeal;
    
    addBattleLog(`你恢復了 ${actualHeal} 點生命值`);
    document.getElementById('player-health-bar').parentElement.classList.add('heal-animation');
    setTimeout(() => {
        document.getElementById('player-health-bar').parentElement.classList.remove('heal-animation');
    }, 500);
    
    updateUI();
}

// 使用技能
function useSkill(skillId) {
    const skill = gameState.player.skills.find(s => s.id === skillId);
    if (!skill) return;
    
    if (skill.type === "ultimate" && skill.used) {
        addBattleLog("這個限定技能已經使用過了！");
        return;
    }
    
    gameState.usedSkillThisTurn = true;
    
    if (skill.type === "ultimate") {
        skill.used = true;
    }
    
    // 應用技能效果
    if (skill.damage > 0) {
        const damage = calculateDamage(skill.damage, true);
        gameState.enemy.health -= damage;
        addBattleLog(`你使用 ${skill.name}，造成 ${damage} 點傷害！`);
        
        // 吸血效果
        if (skill.effect && skill.effect.type === "vampire") {
            const healAmount = Math.floor(damage * skill.effect.percent / 100);
            gameState.player.health = Math.min(gameState.player.health + healAmount, gameState.player.maxHealth);
            addBattleLog(`你吸收了 ${healAmount} 點生命值！`);
        }
    }
    
    if (skill.heal > 0) {
        const healBoost = getHealBoost();
        const actualHeal = Math.min(skill.heal + healBoost, gameState.player.maxHealth - gameState.player.health);
        gameState.player.health += actualHeal;
        addBattleLog(`你使用 ${skill.name}，恢復了 ${actualHeal} 點生命值！`);
    }
    
    // 應用特殊效果
    if (skill.effect) {
        applySkillEffect(skill, false);
    }
    
    if (checkBattleEnd()) return;
    
    showScreen('battle-screen');
    updateUI();
}

// 應用技能效果
function applySkillEffect(skill, isEnemy) {
    const target = isEnemy ? gameState.player : gameState.enemy;
    const source = isEnemy ? "敵人" : "你";
    
    switch(skill.effect.type) {
        case "stun":
            if (Math.random() * 100 < (skill.effect.chance || 100)) {
                if (isEnemy) {
                    gameState.playerStunned = true;
                } else {
                    gameState.enemyStunned = true;
                }
                addBattleLog(`${source}被暈眩了！`);
            }
            break;
            
        case "poison":
            target.effects.push({
                type: "poison",
                damage: skill.effect.damage,
                duration: skill.effect.duration,
                source: skill.name
            });
            addBattleLog(`${isEnemy ? "你" : "敵人"}中毒了！`);
            break;
    }
}

// 結束回合
function endTurn() {
    gameState.usedSkillThisTurn = false;
    gameState.usedAttackThisTurn = false;
    enemyTurn();
}

// 敵人回合
function enemyTurn() {
    if (gameState.enemyStunned) {
        addBattleLog("敵人被暈眩了，無法行動！");
        gameState.enemyStunned = false;
        startNewRound();
        return;
    }
    
    // 處理持續效果
    processEffects();
    
    // 敵人行動
    if (gameState.enemy.skill && Math.random() < 0.7) {
        // 使用技能
        const skill = gameState.enemy.skill;
        if (skill.damage > 0) {
            const damage = calculateDamage(skill.damage, false);
            gameState.player.health -= damage;
            addBattleLog(`敵人使用 ${skill.name}，造成 ${damage} 點傷害！`);
        }
        
        if (skill.heal > 0) {
            const healAmount = Math.min(skill.heal, gameState.enemy.maxHealth - gameState.enemy.health);
            gameState.enemy.health += healAmount;
            addBattleLog(`敵人使用 ${skill.name}，恢復了 ${healAmount} 點生命值！`);
        }
        
        if (skill.effect) {
            applySkillEffect(skill, true);
        }
    } else {
        // 普通攻擊
        const damage = calculateDamage(Math.floor(Math.random() * 256), false);
        gameState.player.health -= damage;
        addBattleLog(`敵人進行普通攻擊，造成 ${damage} 點傷害！`);
    }
    
    if (checkBattleEnd()) return;
    
    startNewRound();
}

// 處理持續效果
function processEffects() {
    // 處理玩家身上的效果
    gameState.player.effects = gameState.player.effects.filter(effect => {
        effect.duration--;
        if (effect.type === "poison") {
            gameState.player.health -= effect.damage;
            addBattleLog(`你受到 ${effect.damage} 點中毒傷害！`);
            document.getElementById('player-health-bar').parentElement.classList.add('damage-animation');
            setTimeout(() => {
                document.getElementById('player-health-bar').parentElement.classList.remove('damage-animation');
            }, 500);
        }
        return effect.duration > 0;
    });
    
    // 處理敵人身上的效果
    gameState.enemy.effects = gameState.enemy.effects.filter(effect => {
        effect.duration--;
        if (effect.type === "poison") {
            gameState.enemy.health -= effect.damage;
            addBattleLog(`敵人受到 ${effect.damage} 點中毒傷害！`);
            document.getElementById('enemy-health-bar').parentElement.classList.add('damage-animation');
            setTimeout(() => {
                document.getElementById('enemy-health-bar').parentElement.classList.remove('damage-animation');
            }, 500);
        }
        return effect.duration > 0;
    });
    
    checkBattleEnd();
}

// 開始新回合
function startNewRound() {
    gameState.round++;
    gameState.usedSkillThisTurn = false;
    gameState.usedAttackThisTurn = false;
    updateUI();
}

// 檢查戰鬥是否結束
function checkBattleEnd() {
    if (gameState.player.health <= 0) {
        gameState.battleStats.losses++;
        addBattleLog("你輸了！");
        setTimeout(() => {
            if (confirm("你輸了！要再試一次嗎？")) {
                startGame(gameState.difficulty);
            } else {
                showScreen('main-menu');
            }
        }, 1000);
        return true;
    }
    
    if (gameState.enemy.health <= 0) {
        gameState.battleStats.wins++;
        addBattleLog("你贏了！");
        
        // 有機率獲得敵人技能
        if (Math.random() < 0.5) {
            const newSkill = {...gameState.enemy.skill};
            const existingSkill = gameState.player.skills.find(s => s.id === newSkill.id);
            if (existingSkill) {
                existingSkill.count = (existingSkill.count || 1) + 1;
                addBattleLog(`技能 ${newSkill.name} 數量增加到 ${existingSkill.count}！`);
                
                // 檢查進化
                if (existingSkill.count >= 3) {
                    evolveSkill(existingSkill);
                }
            } else {
                newSkill.count = 1;
                gameState.player.skills.push(newSkill);
                addBattleLog(`你獲得了新技能：${newSkill.name}！`);
            }
        } else {
            addBattleLog("很遺憾，你沒有獲得敵人的技能。");
        }
        
        setTimeout(() => {
            if (confirm("你贏了！要再玩一次嗎？")) {
                startGame(gameState.difficulty);
            } else {
                showScreen('main-menu');
            }
        }, 1000);
        return true;
    }
    
    return false;
}

// 技能進化
function evolveSkill(skill) {
    addBattleLog(`✨ 技能 ${skill.name} 進化了！`);
    
    if (skill.damage > 0) {
        skill.damage = Math.floor(skill.damage * 1.5);
    }
    if (skill.heal > 0) {
        skill.heal = Math.floor(skill.heal * 1.5);
    }
    if (skill.effect && skill.effect.damage) {
        skill.effect.damage = Math.floor(skill.effect.damage * 1.2);
    }
    
    skill.count = 1;
}

// 計算傷害
function calculateDamage(baseDamage, isPlayer) {
    let damage = baseDamage;
    
    // 應用傷害加成
    if (isPlayer) {
        const damageBoost = getDamageBoost();
        damage = Math.floor(damage * (1 + damageBoost / 100));
    } else {
        // 敵人難度加成
        if (gameState.difficulty === 'hell') {
            damage = Math.floor(damage * 1.2);
        }
    }
    
    return damage;
}

// 獲取傷害加成
function getDamageBoost() {
    let boost = 0;
    gameState.player.skills.forEach(skill => {
        if (skill.effect && skill.effect.type === "damage_boost") {
            boost += skill.effect.value;
        }
    });
    return boost;
}

// 獲取治療加成
function getHealBoost() {
    let boost = 0;
    gameState.player.skills.forEach(skill => {
        if (skill.effect && skill.effect.type === "heal_boost") {
            boost += skill.effect.value;
        }
    });
    return Math.floor(boost);
}

// 顯示技能選擇
function showSkillSelection() {
    const activeSkills = gameState.player.skills.filter(skill => skill.type === "active");
    const container = document.getElementById('active-skill-list');
    container.innerHTML = '';
    
    if (activeSkills.length === 0) {
        container.innerHTML = '<p>你沒有可用的主動技能</p>';
        return;
    }
    
    activeSkills.forEach(skill => {
        const skillElement = document.createElement('div');
        skillElement.className = 'skill-item';
        skillElement.innerHTML = `
            <div class="skill-name">${skill.name}</div>
            <div class="skill-stats">
                ${skill.damage > 0 ? `傷害: ${skill.damage} ` : ''}
                ${skill.heal > 0 ? `治療: ${skill.heal} ` : ''}
            </div>
            <div class="skill-description">${skill.description}</div>
            <div class="skill-rarity">${'★'.repeat(skill.rarity)}</div>
            ${skill.count >= 3 ? '<span class="evolve-badge">已進化</span>' : ''}
            <button onclick="useSkill(${skill.id})">使用</button>
        `;
        container.appendChild(skillElement);
    });
    
    showScreen('skill-select-screen');
}

// 顯示限定技能選擇
function showUltimateSelection() {
    const ultimateSkills = gameState.player.skills.filter(skill => skill.type === "ultimate" && !skill.used);
    const container = document.getElementById('ultimate-skill-list');
    container.innerHTML = '';
    
    if (ultimateSkills.length === 0) {
        container.innerHTML = '<p>沒有可用的限定技能</p>';
        return;
    }
    
    ultimateSkills.forEach(skill => {
        const skillElement = document.createElement('div');
        skillElement.className = 'skill-item ultimate';
        skillElement.innerHTML = `
            <div class="skill-name">${skill.name} [限定技]</div>
            <div class="skill-stats">
                ${skill.damage > 0 ? `傷害: ${skill.damage} ` : ''}
                ${skill.heal > 0 ? `治療: ${skill.heal} ` : ''}
            </div>
            <div class="skill-description">${skill.description}</div>
            <div class="skill-rarity">${'★'.repeat(skill.rarity)}</div>
            ${skill.count >= 3 ? '<span class="evolve-badge">已進化</span>' : ''}
            <button onclick="useSkill(${skill.id})">使用</button>
        `;
        container.appendChild(skillElement);
    });
    
    showScreen('ultimate-skill-screen');
}

// 顯示技能庫
function showSkills() {
    const container = document.getElementById('skill-list');
    container.innerHTML = '';
    
    if (gameState.player.skills.length === 0) {
        container.innerHTML = '<p>你還沒有任何技能</p>';
    } else {
        gameState.player.skills.forEach(skill => {
            const skillElement = document.createElement('div');
            skillElement.className = `skill-item ${skill.type} ${skill.used ? 'used' : ''}`;
            skillElement.innerHTML = `
                <div class="skill-name">${skill.name} 
                    ${skill.type === "ultimate" ? '[限定技]' : ''}
                    ${skill.type === "passive" ? '[被動]' : ''}
                </div>
                <div class="skill-stats">
                    ${skill.damage > 0 ? `傷害: ${skill.damage} ` : ''}
                    ${skill.heal > 0 ? `治療: ${skill.heal} ` : ''}
                    ${skill.used ? '<span style="color:red">[已使用]</span>' : ''}
                </div>
                <div class="skill-description">${skill.description}</div>
                <div class="skill-rarity">
                    ${'★'.repeat(skill.rarity)}
                    <span style="margin-left: 10px;">數量: ${skill.count || 1}</span>
                    ${skill.count >= 3 ? '<span class="evolve-badge">已進化</span>' : ''}
                </div>
            `;
            container.appendChild(skillElement);
        });
    }
    
    showScreen('skill-screen');
}

// 顯示戰績
function showBattleRecord() {
    const container = document.getElementById('battle-record');
    const winRate = gameState.battleStats.wins + gameState.battleStats.losses > 0 
        ? ((gameState.battleStats.wins / (gameState.battleStats.wins + gameState.battleStats.losses)) * 100).toFixed(1)
        : 0;
    
    container.innerHTML = `
        <p>勝利: ${gameState.battleStats.wins}</p>
        <p>失敗: ${gameState.battleStats.losses}</p>
        <p>勝率: ${winRate}%</p>
        <p>技能數量: ${gameState.player.skills.length}</p>
    `;
    
    showScreen('record-screen');
}

// 添加戰鬥日誌
function addBattleLog(message) {
    const log = document.getElementById('battle-log');
    const newEntry = document.createElement('p');
    newEntry.textContent = `[回合 ${gameState.round}] ${message}`;
    log.appendChild(newEntry);
    log.scrollTop = log.scrollHeight;
}

// 更新UI
function updateUI() {
    // 更新生命值
    document.getElementById('player-health').textContent = 
        `${gameState.player.health}/${gameState.player.maxHealth}`;
    document.getElementById('enemy-health').textContent = 
        `${gameState.enemy.health}/${gameState.enemy.maxHealth}`;
    
    // 更新生命值條
    const playerHealthPercent = (gameState.player.health / gameState.player.maxHealth) * 100;
    const enemyHealthPercent = (gameState.enemy.health / gameState.enemy.maxHealth) * 100;
    
    document.getElementById('player-health-bar').style.width = `${playerHealthPercent}%`;
    document.getElementById('enemy-health-bar').style.width = `${enemyHealthPercent}%`;
    
    // 更新回合數
    document.getElementById('round-count').textContent = gameState.round;
    
    // 更新敵人技能信息
    if (gameState.enemy.skill) {
        document.getElementById('enemy-skill-name').textContent = gameState.enemy.skill.name;
    }
    
    // 更新狀態效果顯示
    updateEffectsDisplay();
    
    // 更新按鈕狀態
    updateButtonStates();
}

// 更新狀態效果顯示
function updateEffectsDisplay() {
    const playerEffects = document.getElementById('player-effects');
    const enemyEffects = document.getElementById('enemy-effects');
    
    playerEffects.innerHTML = '<strong>你的狀態:</strong><br>' + 
        (gameState.player.effects.length > 0 
            ? gameState.player.effects.map(e => `${e.source}(${e.duration})`).join(', ')
            : '無');
    
    enemyEffects.innerHTML = '<strong>敵人狀態:</strong><br>' + 
        (gameState.enemy.effects.length > 0 
            ? gameState.enemy.effects.map(e => `${e.source}(${e.duration})`).join(', ')
            : '無');
}

// 更新按鈕狀態
function updateButtonStates() {
    // 在戰鬥界面中更新按鈕的可用狀態
    if (gameState.currentScreen === 'battle-screen') {
        // 這裡可以根據遊戲狀態禁用特定按鈕
        // 例如：如果已經使用過技能，則禁用技能按鈕
    }
}

// 保存遊戲
function saveGame() {
    const saveData = {
        battleStats: gameState.battleStats,
        player: {
            skills: gameState.player.skills
        }
    };
    localStorage.setItem('fightingPVPSave', JSON.stringify(saveData));
    alert('遊戲已保存！');
}

// 載入遊戲
function loadGame() {
    initGame();
    alert('遊戲已載入！');
}

// 返回戰鬥
function backToBattle() {
    showScreen('battle-screen');
}

// 返回主菜單
function backToMenu() {
    showScreen('main-menu');
}

// 初始化遊戲
window.onload = initGame;