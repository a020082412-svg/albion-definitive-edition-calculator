import { useState } from 'react';
import { useCommunityPrice, submitPriceReport } from '../hooks/useCommunityPrice';
import './CommunityPricePanel.css';

export default function CommunityPricePanel({ item, city, buyPrice, sellPrice, userId }) {
  const { priceData, loading, error, refetch } = useCommunityPrice(item, city);
  const [reportState, setReportState] = useState('idle');
  const [reportMsg, setReportMsg] = useState('');

  const handleReport = async () => {
    if (!item || !city || !buyPrice || !sellPrice) {
      setReportMsg('Completa los campos de item, ciudad y precios primero.');
      setReportState('error');
      return;
    }
    setReportState('loading');
    setReportMsg('');
    try {
      const result = await submitPriceReport({ item, city, buyPrice, sellPrice, userId });
      setReportState('success');
      setReportMsg(result.message || 'Precio reportado!');
      setTimeout(() => { setReportState('idle'); refetch(); }, 2500);
    } catch (err) {
      setReportState('error');
      setReportMsg(err.message);
      setTimeout(() => setReportState('idle'), 4000);
    }
  };

  const getStatusInfo = () => {
    if (!priceData) return null;
    if (priceData.status === 'no_data') return { dot: 'ROJO', label: 'Sin datos', className: 'status-none' };
    if (priceData.status === 'insufficient') return { dot: 'AMARILLO', label: 'Pocos datos (' + priceData.samples + '/3 reportes)', className: 'status-low' };
    if (priceData.confidence >= 0.65) return { dot: 'VERDE', label: 'Confiable', className: 'status-good' };
    return { dot: 'AMARILLO', label: 'Datos limitados', className: 'status-medium' };
  };

  const statusInfo = getStatusInfo();

  const statusIcon = (s) => {
    if (!s) return null;
    if (s.dot === 'VERDE') return '🟢';
    if (s.dot === 'AMARILLO') return '🟡';
    return '🔴';
  };

  return (
    <div className="cpp-panel">
      <div className="cpp-header">
        <span className="cpp-title">Precio Comunitario</span>
        <button className="cpp-refresh" onClick={refetch} disabled={loading} title="Actualizar">
          {loading ? '...' : 'R'}
        </button>
      </div>

      <div className="cpp-prices">
        {loading && !priceData ? (
          <div className="cpp-loading">Cargando datos...</div>
        ) : error ? (
          <div className="cpp-error">Error: {error}</div>
        ) : !priceData || priceData.status === 'no_data' ? (
          <div className="cpp-no-data">
            <span>🔴</span>
            <span>Sin datos recientes</span>
            <span className="cpp-no-data-sub">Se el primero en reportar</span>
          </div>
        ) : priceData.status === 'insufficient' ? (
          <div className="cpp-insufficient">
            <span>🟡</span>
            <span>Pocos datos ({priceData.samples} reporte{priceData.samples !== 1 ? 's' : ''})</span>
            <span className="cpp-no-data-sub">Se necesitan minimo 3</span>
          </div>
        ) : (
          <>
            <div className="cpp-price-row">
              <div className="cpp-price-item">
                <label>Compra</label>
                <span className="cpp-price-value cpp-buy">
                  {priceData.buy ? priceData.buy.toLocaleString() : '--'}
                </span>
              </div>
              <div className="cpp-divider" />
              <div className="cpp-price-item">
                <label>Venta</label>
                <span className="cpp-price-value cpp-sell">
                  {priceData.sell ? priceData.sell.toLocaleString() : '--'}
                </span>
              </div>
            </div>
            <div className="cpp-meta">
              <div className={'cpp-status ' + (statusInfo ? statusInfo.className : '')}>
                {statusIcon(statusInfo)} {statusInfo ? statusInfo.label : ''}
              </div>
              <div className="cpp-samples">
                <span>{priceData.samples} reporte{priceData.samples !== 1 ? 's' : ''}</span>
                <span className="cpp-separator"> - </span>
                <span>Conf. {Math.round((priceData.confidence || 0) * 100)}%</span>
              </div>
              {priceData.lastUpdate && (
                <div className="cpp-update">Actualizado {priceData.lastUpdate}</div>
              )}
            </div>
          </>
        )}
      </div>

      {priceData && priceData.status === 'ok' && (
        <div className="cpp-confidence-bar">
          <div
            className="cpp-confidence-fill"
            style={{ width: Math.round((priceData.confidence || 0) * 100) + '%' }}
          />
        </div>
      )}

      <div className="cpp-actions">
        <button
          className={'cpp-report-btn ' + reportState}
          onClick={handleReport}
          disabled={reportState === 'loading'}
        >
          {reportState === 'loading' && 'Enviando...'}
          {reportState === 'success' && 'Reportado!'}
          {reportState === 'error' && 'Error'}
          {reportState === 'idle' && 'Reportar precio actual'}
        </button>
        {reportMsg && (
          <div className={'cpp-report-msg ' + reportState}>{reportMsg}</div>
        )}
      </div>
    </div>
  );
}