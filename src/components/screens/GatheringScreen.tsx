// src/components/screens/GatheringScreen.tsx
// 採取画面：ボタンを押して資材を集めるメインゲームプレイ。

import { useState, useCallback } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { GATHER_NODE_MASTER, ITEM_MASTER } from '../../data/masters';
import type { GatherNodeMaster, GatherResult } from '../../types/game';

// ============================================================
// === 採取ロジック（純粋関数） ===
// ============================================================

/**
 * 採取を実行してドロップ結果を計算する。
 * スキルレベルに応じてドロップ率がボーナスアップ。
 */
function calcGatherResult(
  node: GatherNodeMaster,
  skillLevel: number
): GatherResult {
  const drops: { itemId: string; amount: number }[] = [];
  const expGained: Record<string, number> = {};

  for (const drop of node.drops) {
    const rate = Math.min(
      1.0,
      drop.baseRate + (drop.skillRateBonus ?? 0) * skillLevel
    );
    if (Math.random() < rate) {
      const amount =
        drop.minAmount +
        Math.floor(Math.random() * (drop.maxAmount - drop.minAmount + 1));
      drops.push({ itemId: drop.itemId, amount });
    }
  }

  // スキル経験値（採取ノードごとに固定値）
  expGained[node.requiredSkill.skillId] = 10 + skillLevel * 2;

  return { drops, expGained, staminaUsed: node.staminaCost };
}

// ============================================================
// === 採取ノードカード ===
// ============================================================
interface NodeCardProps {
  node: GatherNodeMaster;
  onGather: (nodeId: string) => void;
  cooldownRemaining: number;
}

function NodeCard({ node, onGather, cooldownRemaining }: NodeCardProps) {
  const player = useGameStore((s) => s.player);
  const skillLevel = player?.skillLevels[node.requiredSkill.skillId] ?? 1;
  const meetsLevel = skillLevel >= node.requiredSkill.minLevel;
  const isCooldown = cooldownRemaining > 0;
  const isDisabled = !meetsLevel || isCooldown;

  return (
    <div className={`node-card ${!meetsLevel ? 'locked' : ''}`}>
      <div className="node-header">
        <span className="node-icon">{node.icon}</span>
        <div className="node-info">
          <h3 className="node-name">{node.name}</h3>
          <p className="node-desc">{node.description}</p>
        </div>
      </div>

      <div className="node-drops">
        {node.drops.map((drop) => {
          const item = ITEM_MASTER[drop.itemId];
          const rate = Math.min(
            100,
            Math.floor((drop.baseRate + (drop.skillRateBonus ?? 0) * skillLevel) * 100)
          );
          return (
            <span key={drop.itemId} className="drop-tag">
              {item?.icon} {item?.name} ({rate}%)
            </span>
          );
        })}
      </div>

      <div className="node-footer">
        <span className="node-skill">
          {node.requiredSkill.skillId === 'mining' ? '⛏️' : '🪓'} Lv.
          {node.requiredSkill.minLevel}〜
          <span className="my-level">（自分: Lv.{skillLevel}）</span>
        </span>
        <span className="node-stamina">🍖 -{node.staminaCost}</span>
      </div>

      <button
        className={`gather-btn ${isCooldown ? 'cooldown' : ''}`}
        onClick={() => onGather(node.id)}
        disabled={isDisabled}
      >
        {!meetsLevel
          ? `🔒 Lv.${node.requiredSkill.minLevel} 必要`
          : isCooldown
          ? `⏳ ${(cooldownRemaining / 1000).toFixed(1)}s`
          : `採取する`}
      </button>
    </div>
  );
}

// ============================================================
// === 採取画面 ===
// ============================================================
export function GatheringScreen() {
  const player = useGameStore((s) => s.player);
  const addItems = useGameStore((s) => s.addItems);
  const changeSatiety = useGameStore((s) => s.changeSatiety);
  const addSkillExp = useGameStore((s) => s.addSkillExp);
  const addNotification = useGameStore((s) => s.addNotification);

  // クールダウン管理: { nodeId: 残りms }
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});
  // 最後の採取結果ログ
  const [log, setLog] = useState<string[]>([]);

  const handleGather = useCallback(
    (nodeId: string) => {
      const node = GATHER_NODE_MASTER[nodeId];
      if (!node || !player) return;

      // 満腹度チェック
      if (player.stats.satiety < node.staminaCost) {
        addNotification('warning', '満腹度が足りません！食料を補給してください。');
        return;
      }

      const skillLevel = player.skillLevels[node.requiredSkill.skillId] ?? 1;
      const result = calcGatherResult(node, skillLevel);

      // State に反映
      addItems(result.drops);
      changeSatiety(-result.staminaUsed);
      for (const [skillId, exp] of Object.entries(result.expGained)) {
        addSkillExp(skillId, exp);
      }

      // ログ更新
      const logMessages = result.drops.map((d) => {
        const item = ITEM_MASTER[d.itemId];
        return `${item?.icon} ${item?.name} ×${d.amount}`;
      });
      if (logMessages.length === 0) {
        logMessages.push('何も手に入らなかった...');
      }
      setLog((prev) => [`[${node.name}] ${logMessages.join('、')}`, ...prev].slice(0, 20));

      // クールダウン開始
      setCooldowns((prev) => ({ ...prev, [nodeId]: node.cooldownMs }));
      const startTime = Date.now();
      const tick = () => {
        const remaining = node.cooldownMs - (Date.now() - startTime);
        if (remaining <= 0) {
          setCooldowns((prev) => { const n = { ...prev }; delete n[nodeId]; return n; });
        } else {
          setCooldowns((prev) => ({ ...prev, [nodeId]: remaining }));
          requestAnimationFrame(tick);
        }
      };
      requestAnimationFrame(tick);
    },
    [player, addItems, changeSatiety, addSkillExp, addNotification]
  );

  const nodes = Object.values(GATHER_NODE_MASTER);

  return (
    <div className="screen gathering-screen">
      <h2 className="screen-title">⛏️ 採取</h2>

      <div className="node-grid">
        {nodes.map((node) => (
          <NodeCard
            key={node.id}
            node={node}
            onGather={handleGather}
            cooldownRemaining={cooldowns[node.id] ?? 0}
          />
        ))}
      </div>

      {log.length > 0 && (
        <div className="gather-log">
          <h3 className="log-title">📋 採取ログ</h3>
          {log.map((entry, i) => (
            <div key={i} className="log-entry">{entry}</div>
          ))}
        </div>
      )}
    </div>
  );
}
