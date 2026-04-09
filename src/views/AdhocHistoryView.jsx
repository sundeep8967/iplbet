import React, { useMemo } from 'react';
import { format } from 'date-fns';

export default function AdhocHistoryView({ userName, adhocBets, adhocVotes, adhocResults, adhocLogs, onClose, t }) {
  const rows = useMemo(() => {
    const settledBetIds = new Set(adhocResults.map((r) => r.adhoc_bet_id));
    const latestByBet = {};
    adhocResults.forEach((r) => {
      const bid = r.adhoc_bet_id;
      if (!latestByBet[bid] || r.settled_at > latestByBet[bid].settled_at) {
        latestByBet[bid] = r;
      }
    });

    const settled = adhocBets
      .filter((b) => settledBetIds.has(b.id))
      .map((bet) => {
        const res = latestByBet[bet.id];
        const vote = adhocVotes.find((v) => v.adhoc_bet_id === bet.id && v.user_name === userName);
        const log = adhocLogs[bet.id];
        let status = 'not_participant';
        let payout = 0;
        if (vote && log) {
          const won = vote.chosen_option === res.winning_option;
          if (log.winnersCount === 0) {
            status = 'no_winners';
            payout = -log.stakePerHead;
          } else if (won) {
            status = 'won';
            payout = log.individualPayout - log.stakePerHead;
          } else {
            status = 'lost';
            payout = -log.stakePerHead;
          }
        } else if (!vote && log?.participants?.includes(userName)) {
          status = 'lost';
          payout = -log.stakePerHead;
        } else if (!vote) {
          status = 'not_participant';
        }
        return { bet, res, vote, log, status, payout };
      });

    const pending = adhocVotes
      .filter((v) => v.user_name === userName && !latestByBet[v.adhoc_bet_id])
      .map((v) => {
        const bet = adhocBets.find((b) => b.id === v.adhoc_bet_id);
        return { bet, vote: v, pending: true };
      });

    return { settled, pending };
  }, [userName, adhocBets, adhocVotes, adhocResults, adhocLogs]);

  return (
    <div className="fade-in" style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: '1.1rem' }}>
          {userName} · {t('adhoc_history_title')}
        </h3>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'var(--card)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
      </div>
      {rows.pending.map(({ bet, vote }) =>
        bet ? (
          <div key={`p-${vote.adhoc_bet_id}`} className="glass-card" style={{ padding: '0.75rem', marginBottom: '0.6rem' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.6 }}>{t('adhoc_pending')}</div>
            <div style={{ fontWeight: 800, fontSize: '0.85rem', marginTop: '4px' }}>{bet.statement}</div>
            <div style={{ fontSize: '0.72rem', marginTop: '4px' }}>
              {t('your_pick')}{' '}
              {vote.chosen_option === 'A' ? bet.option_a : bet.option_b}
            </div>
          </div>
        ) : null
      )}
      {rows.settled.length === 0 && rows.pending.length === 0 ? (
        <p style={{ opacity: 0.5, textAlign: 'center' }}>{t('adhoc_no_history')}</p>
      ) : (
        rows.settled.map(({ bet, res, vote, log, status, payout }) => (
          <div
            key={bet.id}
            className="glass-card"
            style={{
              padding: '0.75rem',
              marginBottom: '0.6rem',
              opacity: status === 'not_participant' ? 0.55 : 1,
            }}
          >
            <div style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.6 }}>
              {format(new Date(res.settled_at), 'MMM d, yyyy h:mm a')}
            </div>
            <div style={{ fontWeight: 800, fontSize: '0.85rem', marginTop: '4px' }}>{bet.statement}</div>
            <div style={{ fontSize: '0.72rem', marginTop: '4px' }}>
              {status === 'not_participant' && t('adhoc_not_participant')}
              {status === 'won' && (
                <>
                  {t('won')} · {res.winning_option === 'A' ? bet.option_a : bet.option_b}
                </>
              )}
              {status === 'lost' && (
                <>
                  {t('lost')} · {vote ? (vote.chosen_option === 'A' ? bet.option_a : bet.option_b) : '—'}
                </>
              )}
              {status === 'no_winners' && t('adhoc_no_winners')}
            </div>
            {status !== 'not_participant' && (
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  marginTop: '6px',
                  color: payout >= 0 ? 'var(--teal)' : 'var(--error)',
                }}
              >
                {payout > 0 ? '+' : ''}₹{Number(payout).toFixed(2)}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
