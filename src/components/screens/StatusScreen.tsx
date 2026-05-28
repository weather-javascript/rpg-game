// src/components/screens/StatusScreen.tsx
// ステータス画面：プレイヤー情報・スキル・インベントリの確認。

import { useGameStore } from '../../stores/gameStore';
import { ITEM_MASTER, SKILL_MASTER, EXP_TABLE, SKILL_EXP_TABLE } from '../../data/masters';

export function StatusScreen() {
  const player = useGameStore((s) => s.player);
  const saveGame = useGameStore((s) => s.saveGame);
  const isSaving = useGameStore((s) => s.isSaving);

  if (!player) return null;

  const inventoryEntries = Object.entries(player.inventory).filter(([, qty]) => qty > 0);

  return (
    <div className="screen status-screen">
      <h2 className="screen-title">📊 ステータス</h2>

      {/* 基本情報 */}
      <section className="status-section">
        <h3>🧙 基本情報</h3>
        <div className="stat-grid">
          <div className="stat-item"><span className="stat-label">名前</span><span>{player.displayName}</span></div>
          <div className="stat-item"><span className="stat-label">レベル</span><span>Lv.{player.stats.level}</span></div>
          <div className="stat-item"><span className="stat-label">経験値</span><span>{player.stats.exp} / {EXP_TABLE[player.stats.level + 1] ?? 'MAX'}</span></div>
          <div className="stat-item"><span className="stat-label">所持金</span><span>💰 {player.gold.toLocaleString()}G</span></div>
          <div className="stat-item"><span className="stat-label">HP</span><span>❤️ {player.stats.hp} / {player.stats.maxHp}</span></div>
          <div className="stat-item"><span className="stat-label">満腹度</span><span>🍖 {player.stats.satiety} / {player.stats.maxSatiety}</span></div>
          <div className="stat-item"><span className="stat-label">攻撃力</span><span>⚔️ {player.stats.attack}</span></div>
          <div className="stat-item"><span className="stat-label">防御力</span><span>🛡️ {player.stats.defense}</span></div>
        </div>
      </section>

      {/* スキル */}
      <section className="status-section">
        <h3>⚡ スキル</h3>
        <div className="skill-list">
          {Object.values(SKILL_MASTER).map((skill) => {
            const level = player.skillLevels[skill.id] ?? 1;
            const exp = player.skillExp[skill.id] ?? 0;
            const nextExp = SKILL_EXP_TABLE[level + 1] ?? Infinity;
            const pct = nextExp === Infinity ? 100 : Math.min(100, (exp / nextExp) * 100);
            return (
              <div key={skill.id} className="skill-row">
                <span className="skill-icon">{skill.icon}</span>
                <div className="skill-detail">
                  <div className="skill-name-row">
                    <span>{skill.name}</span>
                    <span className="skill-level">Lv.{level}</span>
                  </div>
                  <div className="skill-exp-bar">
                    <div className="skill-exp-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* インベントリ */}
      <section className="status-section">
        <h3>🎒 インベントリ（{inventoryEntries.length}種類）</h3>
        {inventoryEntries.length === 0 ? (
          <p className="empty-msg">アイテムを所持していません</p>
        ) : (
          <div className="inventory-grid">
            {inventoryEntries.map(([itemId, qty]) => {
              const item = ITEM_MASTER[itemId];
              if (!item) return null;
              return (
                <div key={itemId} className={`inventory-item rarity-${item.rarity}`} title={item.description}>
                  <span className="inv-icon">{item.icon}</span>
                  <span className="inv-name">{item.name}</span>
                  <span className="inv-qty">×{qty}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* セーブボタン */}
      <div className="save-section">
        <button className="save-btn-large" onClick={saveGame} disabled={isSaving}>
          {isSaving ? '💾 保存中...' : '💾 データをセーブする'}
        </button>
        <p className="save-hint">最終セーブ: {player.lastSavedAt ? new Date(player.lastSavedAt).toLocaleString('ja-JP') : '未セーブ'}</p>
      </div>
    </div>
  );
}
