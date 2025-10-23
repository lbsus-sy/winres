// 遊戲狀態
const gameState = {
    currentScreen: 'main-menu',
    previousScreen: 'main-menu',
    gameMode: 'single', // 'single' 或 'pvp'
    difficulty: 'easy',
    round: 1,
    player: {
        health: 1000,
        maxHealth: 1000,
        skills: [],
        effects: [],
        trophies: 1000, // 初始獎杯數
        wins: 0,
        losses: 0
    },
    enemy: {
        health: 1000,
        maxHealth: 1000,
        skill: null,
        skills: [],
        effects: [],
        trophies: 0,
        isAI: true
    },
    battleStats: {
        wins: 0,
        losses: 0
    },
    usedSkillThisTurn: false,
    usedAttackThisTurn: false,
    usedHealThisTurn: false,
    enemyStunned: false,
    playerStunned: false,
    matchmakingTimer: 0,
    matchmakingInterval: null
};

// 完整的技能數據庫
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
        name: "鋼鐵皮膚",
        damage: 0,
        heal: 0,
        rarity: 3,
        type: "passive",
        effect: { type: "defense", value: 10 },
        description: "被動：減少受到的所有傷害10%",
        used: false
    },
    {
        id: 9,
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
        id: 10,
        name: "鳳凰重生",
        damage: 0,
        heal: 500,
        rarity: 4,
        type: "ultimate",
        effect: null,
        description: "限定技：恢復500點生命值（每場戰鬥只能使用一次）",
        used: false
    },
    {
        id: 11,
        name: "時間停止",
        damage: 0,
        heal: 0,
        rarity: 5,
        type: "ultimate",
        effect: { type: "stun", duration: 3 },
        description: "限定技：暈眩敵人3回合並獲得額外回合（每場戰鬥只能使用一次）",
        used: false
    },
    {
        id: 12,
        name: "元素風暴",
        damage: 400,
        heal: 0,
        rarity: 5,
        type: "ultimate",
        effect: { type: "poison", damage: 100, duration: 3 },
        description: "限定技：造成400點傷害並使敵人中毒3回合（每場戰鬥只能使用一次）",
        used: false
    }
];

// 虛擬玩家池（用於匹配模式）
const virtualPlayers = [
    { name: "初學者", trophies: 800, skills: [1, 2] },
    { name: "戰士", trophies: 1200, skills: [1, 2, 3] },
    { name: "法師", trophies: 1500, skills: [1, 2, 3, 4] },
    { name: "高手", trophies: 1800, skills: [1, 2, 3, 4, 5] },
    { name: "大師", trophies: 2200, skills: [1, 2, 3, 4, 5, 6] },
    { name: "傳奇", trophies: 2800, skills: [1, 2, 3, 4, 5, 6, 7, 8] }
];

// 初始化遊戲
function initGame() {
    loadGame();
    
    // 如果沒有技能，給玩家初始技能
    if (gameState.player.skills.length === 0) {
        const startingSkills = skills.filter(skill => skill.rarity === 1 && skill.type === "active");
        const randomSkill = {...startingSkills[Math.floor(Math.random() * startingSkills.length)]};
        randomSkill.count = 1;
        gameState.player.skills.push(randomSkill);
        saveGame();
    }
    
    updateUI();
}

// 切換屏幕
function showScreen(screenId) {
    gameState.previousScreen = gameState.currentScreen;
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    gameState.currentScreen = screenId;
    updateUI();
}

// 開始單人遊戲
function startSinglePlayer(difficulty) {
    gameState.gameMode = 'single';
    gameState.difficulty = difficulty;
    resetBattleState();
    
    // 為敵人隨機選擇技能
    const availableSkills = skills.filter(skill => 
        skill.type === "active" && 
        (difficulty === 'easy' ? skill.rarity <= 3 : skill.rarity <= 4)
    );
    const enemySkill = {...availableSkills[Math.floor(Math.random() * availableSkills.length)]};
    gameState.enemy.skill = enemySkill;
    gameState.enemy.skills = [enemySkill];
    gameState.enemy.isAI = true;
    
    showScreen('battle-screen');
    addBattleLog("戰鬥開始！敵人獲得了技能: " + gameState.enemy.skill.name);
    updateUI();
}

// 開始匹配模式
function startMatchmaking() {
    gameState.gameMode = 'pvp';
    gameState.matchmakingTimer = 0;
    
    // 顯示匹配狀態
    document.getElementById('matchmaking-status').style.display = 'block';
    
    // 開始計時器
    gameState.matchmakingInterval = setInterval(() => {
        gameState.matchmakingTimer++;
        document.getElementById('matchmaking-timer').textContent = gameState.matchmakingTimer;
        
        // 每3秒嘗試匹配
        if (gameState.matchmakingTimer % 3 === 0) {
            tryMatchPlayer();
        }
    }, 1000);
}

// 嘗試匹配玩家
function tryMatchPlayer() {
    // 在虛擬玩家池中尋找獎杯數接近的對手
    const playerTrophies = gameState.player.trophies;
    const potentialOpponents = virtualPlayers.filter(vp => 
        Math.abs(vp.trophies - playerTrophies) <= 400
    );
    
    if (potentialOpponents.length > 0) {
        // 找到匹配，開始戰鬥
        clearInterval(gameState.matchmakingInterval);
        document.getElementById('matchmaking-status').style.display = 'none';
        
        const opponent = potentialOpponents[Math.floor(Math.random() * potentialOpponents.length)];
        startPvPBattle(opponent);
    }
}

// 開始PVP戰鬥
function startPvPBattle(opponent) {
    resetBattleState();
    
    // 設置對手
    gameState.enemy.isAI = false;
    gameState.enemy.trophies = opponent.trophies;
    gameState.enemy.skills = opponent.skills.map(skillId => {
        const skill = skills.find(s => s.id === skillId);
        return skill ? {...skill, count: 1} : null;
    }).filter(skill => skill !== null);
    
    // 選擇一個主要技能顯示
    if (gameState.enemy.skills.length > 0) {
        gameState.enemy.skill = gameState.enemy.skills[0];
    }
    
    showScreen('battle-screen');
    addBattleLog(`匹配成功！對手: ${opponent.name} (${opponent.trophies}獎杯)`);
    addBattleLog("PVP戰鬥開始！");
    updateUI();
}

// 取消匹配
function cancelMatchmaking() {
    clearInterval(gameState.matchmakingInterval);
    document.getElementById('matchmaking-status').style.display = 'none';
    gameState.gameMode = 'single';
}

// 重置戰鬥狀態
function resetBattleState() {
    gameState.round = 1;
    gameState.player.health = 1000;
    gameState.player.maxHealth = 1000;
    gameState.player.effects = [];
    gameState.enemy.health = gameState.difficulty === 'hell' ? 1500 : 1000;
    gameState.enemy.maxHealth = gameState.difficulty === 'hell' ? 1500 : 1000;
    gameState.enemy.effects = [];
    gameState.usedSkillThisTurn = false;
    gameState.usedAttackThisTurn = false;
    gameState.usedHealThisTurn = false;
    gameState.enemyStunned = false;
    gameState.playerStunned = false;
    
    // 重置限定技能使用狀態
    gameState.player.skills.forEach(skill => {
        if (skill.type === "ultimate") {
            skill.used = false;
        }
    });
}

// 玩家行動
function playerAction(action) {
    if (gameState.playerStunned) {
        addBattleLog("你被暈眩了，無法行動！");
        if (gameState.gameMode === 'single') {
            enemyTurn();
        }
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
            if (gameState.usedHealThisTurn) {
                addBattleLog("本回合已經恢復過生命值！");
                return;
            }
            performHeal();
            gameState.usedHealThisTurn = true;
            break;
    }
    
    updateUI();
    
    // 在PVP模式中，行動後自動結束回合
    if (gameState.gameMode === 'pvp') {
        setTimeout(() => {
            endTurn();
        }, 1000);
    }
}

// 執行普通攻擊
function performAttack() {
    const baseDamage = Math.floor(Math.random() * 256);
    const damage = calculateDamage(baseDamage, true);
    gameState.enemy.health -= damage;
    
    addBattleLog(`你進行普通攻擊，造成 ${damage} 點傷害！`);
    
    // 檢查暴擊
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
    if (!skill) {
        addBattleLog("技能不存在！");
        return;
    }
    
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
    gameState.usedHealThisTurn = false;
    
    if (gameState.gameMode === 'single') {
        enemyTurn();
    } else {
        // PVP模式 - 處理敵人行動
        pvpEnemyTurn();
    }
}

// 敵人回合（單人模式）
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

// PVP敵人回合
function pvpEnemyTurn() {
    if (gameState.enemyStunned) {
        addBattleLog("敵人被暈眩了，無法行動！");
        gameState.enemyStunned = false;
        startNewRound();
        return;
    }
    
    // 處理持續效果
    processEffects();
    
    // 簡單的AI邏輯
    const availableSkills = gameState.enemy.skills.filter(skill => 
        skill.type === "active" || (skill.type === "ultimate" && !skill.used)
    );
    
    let actionTaken = false;
    
    // 優先使用治療技能（如果生命值低）
    if (gameState.enemy.health < gameState.enemy.maxHealth * 0.3) {
        const healSkill = availableSkills.find(skill => skill.heal > 0);
        if (healSkill) {
            const healAmount = Math.min(healSkill.heal, gameState.enemy.maxHealth - gameState.enemy.health);
            gameState.enemy.health += healAmount;
            addBattleLog(`敵人使用 ${healSkill.name}，恢復了 ${healAmount} 點生命值！`);
            actionTaken = true;
        }
    }
    
    // 使用攻擊技能
    if (!actionTaken && availableSkills.length > 0) {
        const attackSkill = availableSkills.find(skill => skill.damage > 0) || availableSkills[0];
        if (attackSkill.damage > 0) {
            const damage = calculateDamage(attackSkill.damage, false);
            gameState.player.health -= damage;
            addBattleLog(`敵人使用 ${attackSkill.name}，造成 ${damage} 點傷害！`);
            
            if (attackSkill.effect) {
                applySkillEffect(attackSkill, true);
            }
            
            if (attackSkill.type === "ultimate") {
                attackSkill.used = true;
            }
        } else if (attackSkill.heal > 0) {
            const healAmount = Math.min(attackSkill.heal, gameState.enemy.maxHealth - gameState.enemy.health);
            gameState.enemy.health += healAmount;
            addBattleLog(`敵人使用 ${attackSkill.name}，恢復了 ${healAmount} 點生命值！`);
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
    gameState.usedHealThisTurn = false;
    updateUI();
}

// 檢查戰鬥是否結束
function checkBattleEnd() {
    if (gameState.player.health <= 0) {
        endBattle(false); // 玩家失敗
        return true;
    }
    
    if (gameState.enemy.health <= 0) {
        endBattle(true); // 玩家勝利
        return true;
    }
    
    return false;
}

// 結束戰鬥
function endBattle(playerWon) {
    if (playerWon) {
        addBattleLog("你贏了！");
        gameState.player.wins++;
        gameState.battleStats.wins++;
        
        if (gameState.gameMode === 'pvp') {
            // PVP模式獎勵
            const trophyGain = 24;
            gameState.player.trophies += trophyGain;
            
            // 有機率獲得敵人的一個技能
            if (gameState.enemy.skills.length > 0 && Math.random() < 0.7) {
                const stolenSkillIndex = Math.floor(Math.random() * gameState.enemy.skills.length);
                const stolenSkill = {...gameState.enemy.skills[stolenSkillIndex]};
                
                const existingSkill = gameState.player.skills.find(s => s.id === stolenSkill.id);
                if (existingSkill) {
                    existingSkill.count = (existingSkill.count || 1) + 1;
                    addBattleLog(`技能 ${stolenSkill.name} 數量增加到 ${existingSkill.count}！`);
                    
                    // 檢查進化
                    if (existingSkill.count >= 3) {
                        evolveSkill(existingSkill);
                    }
                } else {
                    stolenSkill.count = 1;
                    gameState.player.skills.push(stolenSkill);
                    addBattleLog(`你獲得了新技能：${stolenSkill.name}！`);
                }
                
                showBattleResult(true, trophyGain, stolenSkill.name);
            } else {
                showBattleResult(true, trophyGain, null);
            }
        } else {
            // 單人模式獎勵
            if (Math.random() < 0.5) {
                const newSkill = {...gameState.enemy.skill};
                const existingSkill = gameState.player.skills.find(s => s.id === newSkill.id);
                if (existingSkill) {
                    existingSkill.count = (existingSkill.count || 1) + 1;
                    addBattleLog(`技能 ${newSkill.name} 數量增加到 ${existingSkill.count}！`);
                    
                    if (existingSkill.count >= 3) {
                        evolveSkill(existingSkill);
                    }
                } else {
                    newSkill.count = 1;
                    gameState.player.skills.push(newSkill);
                    addBattleLog(`你獲得了新技能：${newSkill.name}！`);
                }
                showBattleResult(true, 0, newSkill.name);
            } else {
                addBattleLog("很遺憾，你沒有獲得敵人的技能。");
                showBattleResult(true, 0, null);
            }
        }
    } else {
        addBattleLog("你輸了！");
        gameState.player.losses++;
        gameState.battleStats.losses++;
        
        if (gameState.gameMode === 'pvp') {
            // PVP模式懲罰
            const trophyLoss = 24;
            gameState.player.trophies = Math.max(0, gameState.player.trophies - trophyLoss);
            
            // 隨機失去一個技能
            if (gameState.player.skills.length > 1 && Math.random() < 0.5) {
                const lostSkillIndex = Math.floor(Math.random() * gameState.player.skills.length);
                const lostSkill = gameState.player.skills[lostSkillIndex];
                gameState.player.skills.splice(lostSkillIndex, 1);
                
                addBattleLog(`你失去了技能：${lostSkill.name}！`);
                showBattleResult(false, -trophyLoss, lostSkill.name);
            } else {
                showBattleResult(false, -trophyLoss, null);
            }
        } else {
            showBattleResult(false, 0, null);
        }
    }
    
    saveGame();
}

// 顯示戰鬥結果
function showBattleResult(won, trophyChange, skillChange) {
    const title = document.getElementById('result-title');
    const content = document.getElementById('result-content');
    
    title.textContent = won ? "🎉 勝利！" : "💀 失敗";
    
    let resultHTML = '';
    
    if (won) {
        resultHTML += '<p class="trophy-change trophy-gain">+24 獎杯</p>';
        if (skillChange) {
            resultHTML += `<p class="skill-change skill-gain">獲得技能: ${skillChange}</p>`;
        }
    } else {
        resultHTML += '<p class="trophy-change trophy-loss">-24 獎杯</p>';
        if (skillChange) {
            resultHTML += `<p class="skill-change skill-loss">失去技能: ${skillChange}</p>`;
        }
    }
    
    resultHTML += `<p>當前獎杯: ${gameState.player.trophies}</p>`;
    resultHTML += `<p>當前技能數量: ${gameState.player.skills.length}</p>`;
    
    content.innerHTML = resultHTML;
    showScreen('battle-result-screen');
}

// 繼續遊玩
function continuePlaying() {
    if (gameState.gameMode === 'pvp') {
        startMatchmaking();
    } else {
        startSinglePlayer(gameState.difficulty);
    }
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
    
    // 應用防禦減傷
    if (!isPlayer) {
        const defense = getDefense();
        damage = Math.floor(damage * (1 - defense / 100));
    }
    
    return Math.max(1, damage); // 確保至少造成1點傷害
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

// 獲取防禦加成
function getDefense() {
    let defense = 0;
    gameState.player.skills.forEach(skill => {
        if (skill.effect && skill.effect.type === "defense") {
            defense += skill.effect.value;
        }
    });
    return defense;
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
        const skillElement = createSkillElement(skill);
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
        const skillElement = createSkillElement(skill);
        container.appendChild(skillElement);
    });
    
    showScreen('ultimate-skill-screen');
}

// 創建技能元素
function createSkillElement(skill) {
    const skillElement = document.createElement('div');
    skillElement.className = `skill-item ${skill.type} ${skill.used ? 'used' : ''}`;
    
    let statsHTML = '';
    if (skill.damage > 0) statsHTML += `傷害: ${skill.damage} `;
    if (skill.heal > 0) statsHTML += `治療: ${skill.heal} `;
    
    skillElement.innerHTML = `
        <div class="skill-name">${skill.name} 
            ${skill.type === "ultimate" ? '[限定技]' : ''}
            ${skill.type === "passive" ? '[被動]' : ''}
        </div>
        <div class="skill-stats">${statsHTML}</div>
        <div class="skill-description">${skill.description}</div>
        <div class="skill-rarity">
            ${'★'.repeat(skill.rarity)}
            ${skill.count > 1 ? `<span style="margin-left: 10px;">數量: ${skill.count}</span>` : ''}
            ${skill.count >= 3 ? '<span class="evolve-badge">已進化</span>' : ''}
        </div>
        ${skill.type !== "passive" ? `<button onclick="useSkill(${skill.id})" ${skill.used ? 'disabled' : ''}>使用</button>` : ''}
    `;
    
    return skillElement;
}

// 顯示技能庫
function showSkills() {
    const container = document.getElementById('skill-list');
    container.innerHTML = '';
    
    if (gameState.player.skills.length === 0) {
        container.innerHTML = '<p>你還沒有任何技能</p>';
    } else {
        gameState.player.skills.forEach(skill => {
            const skillElement = createSkillElement(skill);
            container.appendChild(skillElement);
        });
    }
    
    showScreen('skill-screen');
}

// 顯示戰績
function showBattleRecord() {
    const container = document.getElementById('battle-record');
    const totalBattles = gameState.player.wins + gameState.player.losses;
    const winRate = totalBattles > 0 
        ? ((gameState.player.wins / totalBattles) * 100).toFixed(1)
        : 0;
    
    container.innerHTML = `
        <p>獎杯: ${gameState.player.trophies}</p>
        <p>總戰鬥: ${totalBattles}</p>
        <p>勝利: ${gameState.player.wins}</p>
        <p>失敗: ${gameState.player.losses}</p>
        <p>勝率: ${winRate}%</p>
        <p>技能數量: ${gameState.player.skills.length}</p>
        <h3>技能列表:</h3>
        <ul>
            ${gameState.player.skills.map(skill => 
                `<li>${skill.name} ${skill.count > 1 ? `(x${skill.count})` : ''} ${skill.count >= 3 ? '★' : ''}</li>`
            ).join('')}
        </ul>
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
    // 更新主菜單統計
    document.getElementById('trophy-count').textContent = gameState.player.trophies;
    document.getElementById('skill-count').textContent = gameState.player.skills.length;
    document.getElementById('win-count').textContent = gameState.player.wins;
    document.getElementById('loss-count').textContent = gameState.player.losses;
    
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
    
    // 更新戰鬥模式顯示
    const battleModeElement = document.getElementById('battle-mode');
    if (gameState.gameMode === 'pvp') {
        battleModeElement.textContent = 'PVP匹配模式';
        document.getElementById('enemy-trophies').style.display = 'block';
        document.getElementById('enemy-trophy-count').textContent = gameState.enemy.trophies;
    } else {
        battleModeElement.textContent = `單人模式 - ${gameState.difficulty === 'easy' ? '簡單' : '地獄'}`;
        document.getElementById('enemy-trophies').style.display = 'none';
    }
    
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
    const attackBtn = document.getElementById('attack-btn');
    const skillBtn = document.getElementById('skill-btn');
    const ultimateBtn = document.getElementById('ultimate-btn');
    const healBtn = document.getElementById('heal-btn');
    const endTurnBtn = document.getElementById('end-turn-btn');
    
    if (attackBtn) attackBtn.disabled = gameState.usedAttackThisTurn || gameState.playerStunned;
    if (skillBtn) skillBtn.disabled = gameState.usedSkillThisTurn || gameState.playerStunned;
    if (ultimateBtn) ultimateBtn.disabled = gameState.usedSkillThisTurn || gameState.playerStunned;
    if (healBtn) healBtn.disabled = gameState.usedHealThisTurn || gameState.playerStunned;
    
    // 在PVP模式中，行動後自動結束回合，所以禁用結束回合按鈕
    if (endTurnBtn && gameState.gameMode === 'pvp') {
        endTurnBtn.disabled = true;
    }
}

// 保存遊戲
function saveGame() {
    const saveData = {
        player: {
            skills: gameState.player.skills,
            trophies: gameState.player.trophies,
            wins: gameState.player.wins,
            losses: gameState.player.losses
        },
        battleStats: gameState.battleStats
    };
    
    try {
        localStorage.setItem('fightingPVPSave', JSON.stringify(saveData));
        console.log('遊戲已保存');
    } catch (e) {
        console.error('保存失敗:', e);
    }
}

// 載入遊戲
function loadGame() {
    try {
        const savedData = localStorage.getItem('fightingPVPSave');
        if (savedData) {
            const parsed = JSON.parse(savedData);
            
            if (parsed.player) {
                gameState.player.skills = parsed.player.skills || [];
                gameState.player.trophies = parsed.player.trophies || 1000;
                gameState.player.wins = parsed.player.wins || 0;
                gameState.player.losses = parsed.player.losses || 0;
            }
            
            if (parsed.battleStats) {
                gameState.battleStats = parsed.battleStats;
            }
            
            console.log('遊戲存檔已載入');
        }
    } catch (e) {
        console.error('載入存檔失敗:', e);
        // 如果載入失敗，初始化默認數據
        initializeDefaultData();
    }
}

// 初始化默認數據
function initializeDefaultData() {
    gameState.player.skills = [];
    gameState.player.trophies = 1000;
    gameState.player.wins = 0;
    gameState.player.losses = 0;
    gameState.battleStats = { wins: 0, losses: 0 };
}

// 重置遊戲
function resetGame() {
    if (confirm('確定要重置遊戲嗎？這將清除所有進度！')) {
        localStorage.removeItem('fightingPVPSave');
        initializeDefaultData();
        initGame();
        alert('遊戲已重置');
    }
}

// 返回戰鬥
function backToBattle() {
    showScreen('battle-screen');
}

// 返回上一個屏幕
function backToPreviousScreen() {
    showScreen(gameState.previousScreen);
}

// 返回主菜單
function backToMenu() {
    // 取消匹配如果正在進行
    if (gameState.matchmakingInterval) {
        cancelMatchmaking();
    }
    showScreen('main-menu');
}

// 初始化遊戲
window.onload = initGame;