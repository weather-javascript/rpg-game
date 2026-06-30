// src/components/screens/PetScreen.tsx
// ver3.0.0: ペット（仲間）画面。所持一覧／詳細・強化／編成／図鑑をタブで切り替える。

import { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { PET_SPECIES_MASTER, PET_SKILL_MASTER, PET_EXCHANGE_TABLE } from '../../data/petsData';
import { defaultPetState, PET_EXP_TABLE, type PetRoleSlot, type OwnedPetInstance } from '../../types/v3types';

type Tab = 'owned' | 'party' | 'codex' | 'exchange';

const RARITY_COLOR: Record<string, string> = { common: '#8a92b2', uncommon: '#7ec98a', rare: '#5fa8e0', epic: '#c060e0', legendary: '#f0c060' };

function petLevel(exp: number): number {
  let lv = 1;
  while (lv < PET_EXP_TABLE.length - 1 && exp >= PET_EXP_TABLE[lv + 1]) lv++;
  return lv;
}

export function PetScreen() {
  const player = useGameStore(s => s.player);
  const feedPet = useGameStore(s => s.feedPet);
  const evolvePet = useGameStore(s => s.evolvePet);
  const awakenPet = useGameStore(s => s.awakenPet);
  const setPartySlot = useGameStore(s => s.setPartySlot);
  const exchangePet = useGameStore(s => s.exchangePet);
  const addNotification = useGameStore(s => s.addNotification);

  const [tab, setTab] = useState<Tab>('owned');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!player) return null;
  const pets = player.pets ?? defaultPetState();

  return (
    <div style={{ padding: '12px 8px 80px' }}>
      <h2 style={{ fontFamily: 'Cinzel,serif', color: '#f0c060', marginBottom: 4, fontSize: '1rem' }}>🐾 ペット</h2>
      <p style={{ fontSize: '0.72rem', color: '#8a92b2', marginBottom: 12 }}>
        戦闘・採取・釣り・店売り・探索を補助する仲間たち。最大3体（メイン/サブ/支援）まで編成できます。
      </p>

      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {([['owned', '📋 所持一覧'], ['party', '⚔️ 編成'], ['codex', '📖 図鑑'], ['exchange', '🔁 交換所']] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '6px 12px', background: tab === t ? 'rgba(240,192,96,0.2)' : '#1c2235', border: `1px solid ${tab === t ? '#f0c060' : '#2d3752'}`, color: tab === t ? '#f0c060' : '#8a92b2', borderRadius: 6, cursor: 'pointer', fontSize: '0.76rem' }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'owned' && (
        <div>
          {pets.owned.length === 0 && <div style={{ color: '#4a5070', fontSize: '0.8rem' }}>まだペットがいません。モンスター討伐や交換所で仲間を探しましょう。</div>}
          {pets.owned.map((pet: OwnedPetInstance) => {
            const species = PET_SPECIES_MASTER[pet.speciesId];
            if (!species) return null;
            const stage = species.evolution[pet.evolutionStage];
            const lv = petLevel(pet.exp);
            return (
              <div key={pet.instanceId} onClick={() => { setSelectedId(pet.instanceId); }}
                style={{ background: selectedId === pet.instanceId ? 'rgba(240,192,96,0.08)' : '#1c2235', border: `1px solid ${selectedId === pet.instanceId ? '#f0c060' : '#2d3752'}`, borderRadius: 8, padding: 10, marginBottom: 8, cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, color: RARITY_COLOR[species.rarity] }}>{pet.nickname || species.name}（{stage?.name}）</span>
                  <span style={{ fontSize: '0.7rem', color: '#8a92b2' }}>Lv.{lv} 絆{pet.bond} 覚醒+{pet.awakening}</span>
                </div>
                <div style={{ fontSize: '0.68rem', color: '#8a92b2' }}>{species.description}</div>
                {selectedId === pet.instanceId && (
                  <div style={{ marginTop: 8, borderTop: '1px solid #2d3752', paddingTop: 8 }}>
                    <div style={{ fontSize: '0.68rem', color: '#7ec98a', marginBottom: 6 }}>
                      パッシブ: {species.passiveSkillIds.map(id => PET_SKILL_MASTER[id]?.name).join(' / ')}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button onClick={(e) => { e.stopPropagation(); feedPet(pet.instanceId); }}
                        style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #2d3752', background: '#161b26', color: '#e8e6ff', fontSize: '0.7rem', cursor: 'pointer' }}>
                        🍖 絆のエサを与える
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); const r = evolvePet(pet.instanceId); addNotification(r.success ? 'success' : 'warning', r.message); }}
                        style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #2d3752', background: '#161b26', color: '#e8e6ff', fontSize: '0.7rem', cursor: 'pointer' }}>
                        ✨ 進化
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); const r = awakenPet(pet.instanceId); addNotification(r.success ? 'success' : 'warning', r.message); }}
                        style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #2d3752', background: '#161b26', color: '#e8e6ff', fontSize: '0.7rem', cursor: 'pointer' }}>
                        🌟 覚醒
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'party' && (
        <div>
          {(['main', 'sub', 'support'] as PetRoleSlot[]).map(slot => {
            const instanceId = pets.party[slot];
            const pet = instanceId ? pets.owned.find(p => p.instanceId === instanceId) : null;
            const species = pet ? PET_SPECIES_MASTER[pet.speciesId] : null;
            return (
              <div key={slot} style={{ background: '#1c2235', border: '1px solid #2d3752', borderRadius: 8, padding: 10, marginBottom: 8 }}>
                <div style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: 6 }}>
                  {slot === 'main' ? '⭐ メイン枠' : slot === 'sub' ? '🔹 サブ枠' : '🛟 支援枠'}
                </div>
                <div style={{ fontSize: '0.75rem', marginBottom: 6, color: species ? '#e8e6ff' : '#4a5070' }}>
                  {species ? (pet?.nickname || species.name) : '（空き）'}
                </div>
                <select value={instanceId ?? ''} onChange={(e) => setPartySlot(slot, e.target.value || null)}
                  style={{ width: '100%', padding: 6, background: '#161b26', border: '1px solid #2d3752', borderRadius: 6, color: '#e8e6ff', fontSize: '0.75rem' }}>
                  <option value="">（空き）</option>
                  {pets.owned.map(p => (
                    <option key={p.instanceId} value={p.instanceId}>{p.nickname || PET_SPECIES_MASTER[p.speciesId]?.name}</option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'codex' && (
        <div>
          {Object.values(PET_SPECIES_MASTER).map(species => {
            const seen = pets.seenSpeciesIds.includes(species.id);
            const owned = pets.owned.some(p => p.speciesId === species.id);
            return (
              <div key={species.id} style={{ background: '#1c2235', border: `1px solid ${owned ? RARITY_COLOR[species.rarity] : '#2d3752'}`, borderRadius: 8, padding: 10, marginBottom: 8 }}>
                {owned || seen ? (
                  <>
                    <div style={{ fontWeight: 700, color: RARITY_COLOR[species.rarity] }}>{species.name} {owned && '✅'}</div>
                    <div style={{ fontSize: '0.68rem', color: '#8a92b2' }}>{species.description}</div>
                    <div style={{ fontSize: '0.65rem', color: '#5fa8e0', marginTop: 4 }}>
                      入手方法: {species.acquisition.map(a => a.detail).join(' / ')}
                    </div>
                    {species.aquariumLinkBonus && (
                      <div style={{ fontSize: '0.65rem', color: '#7ec98a' }}>
                        水族館連動: 登録魚{species.aquariumLinkBonus.requiredFishBookCount}種以上で効果強化
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ fontSize: '0.72rem', color: '#4a5070' }}>❓ 未発見 — {species.codexHintWhenUnseen}</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'exchange' && (
        <div>
          {PET_EXCHANGE_TABLE.map(entry => {
            const species = PET_SPECIES_MASTER[entry.speciesId];
            if (!species) return null;
            return (
              <div key={entry.speciesId} style={{ background: '#1c2235', border: '1px solid #2d3752', borderRadius: 8, padding: 10, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: RARITY_COLOR[species.rarity] }}>{species.name}</div>
                  <div style={{ fontSize: '0.68rem', color: '#8a92b2' }}>
                    必要素材: {entry.cost.map(c => `${c.itemId} ×${c.amount}`).join(' / ')}
                  </div>
                </div>
                <button onClick={() => { const r = exchangePet(entry.speciesId); addNotification(r.success ? 'success' : 'warning', r.message); }}
                  style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #f0c060', background: 'rgba(240,192,96,0.15)', color: '#f0c060', cursor: 'pointer', fontSize: '0.76rem' }}>
                  交換する
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
