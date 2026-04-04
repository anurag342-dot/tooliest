// ============================================
// TOOLIEST.COM — Tool Renderers Part 5
// FINANCE TOOLS with visual charts & insights
// ============================================

// ---- Mini Canvas Chart Library ----
const Chart = {
  colors: { primary:'#8b5cf6', secondary:'#06b6d4', tertiary:'#f43f5e', success:'#10b981', warning:'#f59e0b', grid:'rgba(255,255,255,0.06)', text:'rgba(255,255,255,0.5)' },

  drawBar(canvas, data, options = {}) {
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    const pad = { t: 20, r: 20, b: 40, l: 60 };
    const cw = w - pad.l - pad.r, ch = h - pad.t - pad.b;
    const maxVal = Math.max(...data.map(d => d.values ? d.values.reduce((a,b)=>a+b,0) : d.value)) * 1.15;

    // Grid
    ctx.strokeStyle = Chart.colors.grid; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + ch - (ch * i / 4);
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke();
      ctx.fillStyle = Chart.colors.text; ctx.font = '11px Inter,sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(Chart.fmtNum(maxVal * i / 4), pad.l - 8, y + 4);
    }

    const barW = Math.min(40, cw / data.length * 0.6);
    const gap = (cw - barW * data.length) / (data.length + 1);

    data.forEach((d, i) => {
      const x = pad.l + gap + i * (barW + gap);
      if (d.values) { // stacked
        let cumY = 0;
        const colors = options.stackColors || [Chart.colors.primary, Chart.colors.tertiary, Chart.colors.warning];
        d.values.forEach((v, j) => {
          const barH = (v / maxVal) * ch;
          const y = pad.t + ch - cumY - barH;
          ctx.fillStyle = colors[j]; ctx.beginPath();
          ctx.roundRect(x, y, barW, barH, j === d.values.length-1 ? [4,4,0,0] : 0); ctx.fill();
          cumY += barH;
        });
      } else {
        const barH = (d.value / maxVal) * ch;
        const y = pad.t + ch - barH;
        const grd = ctx.createLinearGradient(x, y, x, pad.t + ch);
        grd.addColorStop(0, d.color || Chart.colors.primary); grd.addColorStop(1, (d.color||Chart.colors.primary)+'44');
        ctx.fillStyle = grd; ctx.beginPath(); ctx.roundRect(x, y, barW, barH, [4,4,0,0]); ctx.fill();
      }
      // Label
      ctx.fillStyle = Chart.colors.text; ctx.font = '10px Inter,sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(d.label, x + barW/2, pad.t + ch + 16);
    });
  },

  drawLine(canvas, datasets, labels) {
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    const pad = { t: 20, r: 20, b: 40, l: 65 };
    const cw = w - pad.l - pad.r, ch = h - pad.t - pad.b;
    let maxVal = 0;
    datasets.forEach(ds => ds.data.forEach(v => { if(v > maxVal) maxVal = v; }));
    maxVal *= 1.1;

    // Grid
    ctx.strokeStyle = Chart.colors.grid; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + ch - (ch * i / 4);
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke();
      ctx.fillStyle = Chart.colors.text; ctx.font = '11px Inter,sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(Chart.fmtNum(maxVal * i / 4), pad.l - 8, y + 4);
    }

    // X labels
    const step = Math.max(1, Math.floor(labels.length / 8));
    labels.forEach((l, i) => {
      if (i % step === 0 || i === labels.length-1) {
        ctx.fillStyle = Chart.colors.text; ctx.font = '10px Inter,sans-serif'; ctx.textAlign = 'center';
        const x = pad.l + (i / (labels.length-1)) * cw;
        ctx.fillText(l, x, pad.t + ch + 18);
      }
    });

    datasets.forEach(ds => {
      const pts = ds.data.map((v, i) => ({
        x: pad.l + (i / (ds.data.length-1)) * cw,
        y: pad.t + ch - (v / maxVal) * ch
      }));
      // Fill
      ctx.beginPath(); ctx.moveTo(pts[0].x, pad.t + ch);
      pts.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.lineTo(pts[pts.length-1].x, pad.t + ch); ctx.closePath();
      const grd = ctx.createLinearGradient(0, pad.t, 0, pad.t + ch);
      grd.addColorStop(0, (ds.color || Chart.colors.primary) + '40');
      grd.addColorStop(1, (ds.color || Chart.colors.primary) + '05');
      ctx.fillStyle = grd; ctx.fill();
      // Line
      ctx.beginPath(); pts.forEach((p,i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.strokeStyle = ds.color || Chart.colors.primary; ctx.lineWidth = 2.5; ctx.stroke();
    });
  },

  drawDoughnut(canvas, segments) {
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    const cx = w/2, cy = h/2, r = Math.min(cx, cy) - 10, inner = r * 0.6;
    const total = segments.reduce((a,s) => a + s.value, 0);
    let angle = -Math.PI / 2;
    segments.forEach(seg => {
      const sweep = (seg.value / total) * Math.PI * 2;
      ctx.beginPath(); ctx.arc(cx, cy, r, angle, angle + sweep);
      ctx.arc(cx, cy, inner, angle + sweep, angle, true); ctx.closePath();
      ctx.fillStyle = seg.color; ctx.fill();
      angle += sweep;
    });
    // Center text
    ctx.fillStyle = '#fff'; ctx.font = 'bold 16px Inter,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(segments[0] ? segments[0].centerText || '' : '', cx, cy + 6);
  },

  fmtNum(n) {
    if (n >= 1e6) return (n/1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n/1e3).toFixed(1) + 'K';
    return Math.round(n).toLocaleString();
  }
};

// ---- Finance Insight Phrases ----
const FinanceInsights = {
  emi(emi, total, interest, principal) {
    const ratio = (interest/principal*100).toFixed(0);
    const phrases = [
      `💡 You'll pay ${ratio}% extra as interest over the loan tenure.`,
      `📊 Your total interest (${Chart.fmtNum(interest)}) is ${interest>principal?'more':'less'} than the principal amount.`,
      `💰 Consider making extra payments — even $100/month extra can save you thousands in interest.`,
      interest/principal > 0.5 ? '⚠️ Your interest is more than 50% of principal. Consider shorter tenure or lower rate.' : '✅ Good ratio! Your interest is within acceptable range.',
      `🏆 Tip: Paying bi-weekly instead of monthly saves you about 1 month of payments per year.`,
    ];
    return phrases;
  },
  mortgage(payment, total, interest) {
    return [
      `🏠 Rule of 28: Your mortgage payment should be less than 28% of your gross monthly income.`,
      `💡 A 1% lower rate could save you ~$${Math.round(total*0.12).toLocaleString()} over the loan life.`,
      `📊 Total cost of ownership: You'll pay $${Math.round(total).toLocaleString()} for this property over time.`,
      `💰 Making one extra payment per year can reduce a 30-year mortgage by ~4 years.`,
    ];
  },
  compound(finalAmount, totalContrib, interest) {
    const mult = (finalAmount / Math.max(1,totalContrib)).toFixed(1);
    return [
      `🚀 Your money grew ${mult}x through compound interest!`,
      `💡 Einstein called compound interest the "eighth wonder of the world."`,
      `📈 Starting 5 years earlier could yield ~${Math.round((finalAmount*0.35)).toLocaleString()} more.`,
      `⏰ The best time to start investing was yesterday. The second best time is today.`,
      interest > totalContrib ? `🎉 Your interest earned exceeds your total contributions!` : `📊 Keep investing — your interest will eventually exceed contributions.`,
    ];
  },
  sip(wealth, invested, returns) {
    return [
      `📈 Your SIP grew your wealth to ₹${Math.round(wealth).toLocaleString()} from ₹${Math.round(invested).toLocaleString()} invested.`,
      `💡 SIP benefits from rupee-cost averaging — you buy more units when prices are low.`,
      `🏆 Consistency beats timing. Regular SIP investors typically outperform lump-sum investors.`,
      returns > invested ? `🎉 Your returns (${Chart.fmtNum(returns)}) exceed your invested amount!` : `📊 Stay patient — returns compound faster in later years.`,
    ];
  },
  retirement(needed, current, gap) {
    return [
      gap > 0 ? `⚠️ You have a retirement gap of $${Math.round(gap).toLocaleString()}. Consider increasing savings.` : `✅ You're on track for retirement! Keep up the good work.`,
      `💡 The 4% Rule: You can safely withdraw 4% of your retirement savings annually.`,
      `📊 Factor in healthcare costs — they typically increase 5-7% per year after retirement.`,
      `🏆 Even small increases in savings rate can make a huge difference over decades.`,
    ];
  },
};

// ---- Chart Legend Helper ----
function chartLegend(items) {
  return '<div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:12px;justify-content:center">' +
    items.map(([color,label]) => `<div style="display:flex;align-items:center;gap:6px"><div style="width:12px;height:12px;border-radius:3px;background:${color}"></div><span style="font-size:0.8rem;color:var(--text-secondary)">${label}</span></div>`).join('') + '</div>';
}

function insightBox(phrases) {
  return `<div style="margin-top:20px;padding:16px;background:var(--bg-glass);border:1px solid var(--border-color);border-radius:var(--radius-lg)"><h4 style="font-size:0.9rem;margin-bottom:12px;color:var(--accent-primary)">💡 Financial Insights</h4>${phrases.map(p => `<p style="font-size:0.85rem;color:var(--text-secondary);padding:6px 0;line-height:1.5">${p}</p>`).join('')}</div>`;
}

Object.assign(ToolRenderers.renderers, {

  // ===== ULTIMATE LOAN & MORTGAGE ANALYZER =====
  'loan-mortgage-analyzer'(c) {
    c.innerHTML = `<div class="tool-workspace-body">
      <div style="background:var(--bg-secondary);padding:16px;border-radius:var(--radius-lg);margin-bottom:20px">
        <h3 style="font-size:1rem;margin-bottom:16px;color:var(--text-primary)">Loan Details</h3>
        <div class="flex gap-4 flex-wrap">
          <div class="input-group" style="flex:1;min-width:150px"><label>Total Amount ($)</label><input type="number" id="ma-price" value="400000"></div>
          <div class="input-group" style="flex:1;min-width:120px"><label>Down Payment (%)</label><input type="number" id="ma-down" value="20" min="0" max="100"></div>
          <div class="input-group" style="flex:1;min-width:120px"><label>Interest Rate (%/yr)</label><input type="number" id="ma-rate" value="6.5" step="0.1"></div>
          <div class="input-group" style="flex:1;min-width:100px"><label>Term (years)</label><input type="number" id="ma-term" value="30"></div>
        </div>
      </div>
      <div style="background:var(--bg-secondary);padding:16px;border-radius:var(--radius-lg);margin-bottom:20px">
        <h3 style="font-size:1rem;margin-bottom:16px;color:var(--text-primary)">Taxes & Insurance (Optional, per year)</h3>
        <div class="flex gap-4 flex-wrap">
          <div class="input-group" style="flex:1"><label>Property/Asset Tax ($)</label><input type="number" id="ma-tax" value="4800"></div>
          <div class="input-group" style="flex:1"><label>Insurance ($)</label><input type="number" id="ma-ins" value="1500"></div>
          <div class="input-group" style="flex:1"><label>Extra Fees/HOA ($/mo)</label><input type="number" id="ma-hoa" value="0"></div>
        </div>
      </div>
      <div class="result-stats mt-4" id="ma-stats"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px">
        <div><h4 style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:8px;text-align:center">Monthly Payment Breakdown</h4>
          <canvas id="ma-doughnut" style="width:100%;height:200px"></canvas><div id="ma-legend"></div></div>
        <div><h4 style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:8px;text-align:center">Balance Over Time</h4>
          <canvas id="ma-line" style="width:100%;height:200px"></canvas></div>
      </div>
      <div id="ma-insights"></div>
    </div>`;

    const calc = () => {
      const price = +document.getElementById('ma-price').value;
      const downPct = +document.getElementById('ma-down').value / 100;
      const loan = price * (1 - downPct);
      const r = +document.getElementById('ma-rate').value / 100 / 12;
      const years = +document.getElementById('ma-term').value;
      const n = years * 12;
      const tax = +document.getElementById('ma-tax').value / 12;
      const ins = +document.getElementById('ma-ins').value / 12;
      const hoa = +document.getElementById('ma-hoa').value;
      const pmi = downPct < 0.2 ? loan * 0.005 / 12 : 0;
      const mp = r === 0 ? loan/n : loan * r * Math.pow(1+r,n) / (Math.pow(1+r,n)-1);
      const total = mp + tax + ins + hoa + pmi;
      const totalPaid = total * n;
      const totalInterest = (mp * n) - loan;

      document.getElementById('ma-stats').innerHTML = [
        ['Total Monthly', '$' + Math.round(total).toLocaleString()], ['Principal & Int', '$' + Math.round(mp).toLocaleString()],
        ['Total Interest', '$' + Math.round(totalInterest).toLocaleString()], ['Total Paid', '$' + Math.round(totalPaid).toLocaleString()]
      ].map(([l,v]) => `<div class="stat-card"><div class="stat-num" style="font-size:1rem">${v}</div><div class="stat-lbl">${l}</div></div>`).join('');

      Chart.drawDoughnut(document.getElementById('ma-doughnut'), [
        { value: mp, color: Chart.colors.primary, centerText: '$' + Math.round(total) + '/mo' },
        { value: tax, color: Chart.colors.warning },
        { value: ins + hoa + pmi, color: Chart.colors.secondary }
      ]);
      document.getElementById('ma-legend').innerHTML = chartLegend([
        [Chart.colors.primary, 'P&I: $' + Math.round(mp)],
        [Chart.colors.warning, 'Tax: $' + Math.round(tax)],
        [Chart.colors.secondary, 'Extra/PMI: $' + Math.round(ins+hoa+pmi)]
      ]);

      const balData = [], labels = [];
      let bal = loan;
      for (let yr = 0; yr <= years; yr++) {
        if (yr % Math.max(1,Math.floor(years/10)) === 0 || yr === years) {
          balData.push(bal); labels.push('Yr ' + yr);
        }
        for (let m = 0; m < 12 && yr < years; m++) { bal -= (mp - bal * r); }
      }
      Chart.drawLine(document.getElementById('ma-line'), [{ data: balData, color: Chart.colors.primary }], labels);
      document.getElementById('ma-insights').innerHTML = insightBox(FinanceInsights.mortgage(mp, totalPaid, totalInterest));
    };
    ['ma-price','ma-down','ma-rate','ma-term','ma-tax','ma-ins','ma-hoa'].forEach(id => document.getElementById(id).addEventListener('input', calc));
    calc();
  },

  // ===== COMPOUND INTEREST =====
  'compound-interest'(c) {
    c.innerHTML = `<div class="tool-workspace-body">
      <div class="flex gap-4 flex-wrap">
        <div class="input-group" style="flex:1;min-width:140px"><label>Initial Investment ($)</label><input type="number" id="ci-principal" value="10000"></div>
        <div class="input-group" style="flex:1;min-width:120px"><label>Monthly Addition ($)</label><input type="number" id="ci-monthly" value="500"></div>
        <div class="input-group" style="flex:1;min-width:110px"><label>Interest Rate (%/yr)</label><input type="number" id="ci-rate" value="8" step="0.1"></div>
        <div class="input-group" style="flex:1;min-width:100px"><label>Years</label><input type="number" id="ci-years" value="20" min="1" max="50"></div>
        <div class="input-group" style="flex:1;min-width:120px"><label>Compound</label><select id="ci-freq"><option value="12" selected>Monthly</option><option value="4">Quarterly</option><option value="1">Annually</option><option value="365">Daily</option></select></div>
      </div>
      <div class="result-stats mt-4" id="ci-stats"></div>
      <div style="margin-top:20px"><h4 style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:8px;text-align:center">Wealth Growth Over Time</h4>
        <canvas id="ci-chart" style="width:100%;height:250px"></canvas><div id="ci-legend"></div></div>
      <div id="ci-insights"></div>
    </div>`;

    const calc = () => {
      const P = +document.getElementById('ci-principal').value;
      const monthly = +document.getElementById('ci-monthly').value;
      const rate = +document.getElementById('ci-rate').value / 100;
      const years = +document.getElementById('ci-years').value;
      const freq = +document.getElementById('ci-freq').value;
      const r = rate / freq;

      const totalData = [], contribData = [], labels = [];
      let balance = P, totalContrib = P;
      for (let yr = 0; yr <= years; yr++) {
        totalData.push(balance); contribData.push(totalContrib); labels.push('Yr ' + yr);
        for (let p = 0; p < freq && yr < years; p++) {
          balance *= (1 + r);
          const monthsInPeriod = 12 / freq;
          balance += monthly * monthsInPeriod;
          totalContrib += monthly * monthsInPeriod;
        }
      }

      const finalAmount = totalData[totalData.length-1];
      const interest = finalAmount - totalContrib;
      document.getElementById('ci-stats').innerHTML = [
        ['Final Amount', '$' + Math.round(finalAmount).toLocaleString()],
        ['Total Invested', '$' + Math.round(totalContrib).toLocaleString()],
        ['Interest Earned', '$' + Math.round(interest).toLocaleString()],
        ['Growth Multiple', (finalAmount/Math.max(1,totalContrib)).toFixed(1) + 'x']
      ].map(([l,v]) => `<div class="stat-card"><div class="stat-num" style="font-size:1rem">${v}</div><div class="stat-lbl">${l}</div></div>`).join('');

      Chart.drawLine(document.getElementById('ci-chart'), [
        { data: totalData, color: Chart.colors.primary },
        { data: contribData, color: Chart.colors.secondary }
      ], labels);
      document.getElementById('ci-legend').innerHTML = chartLegend([
        [Chart.colors.primary, 'Total With Interest'],
        [Chart.colors.secondary, 'Total Contributed']
      ]);
      document.getElementById('ci-insights').innerHTML = insightBox(FinanceInsights.compound(finalAmount, totalContrib, interest));
    };
    ['ci-principal','ci-monthly','ci-rate','ci-years','ci-freq'].forEach(id => document.getElementById(id).addEventListener('input', calc));
    calc();
  },

  // ===== SIP CALCULATOR =====
  'sip-calculator'(c) {
    c.innerHTML = `<div class="tool-workspace-body">
      <div class="flex gap-4 flex-wrap">
        <div class="input-group" style="flex:1;min-width:150px"><label>Monthly SIP (₹/$)</label><input type="number" id="sip-amt" value="5000"></div>
        <div class="input-group" style="flex:1;min-width:130px"><label>Expected Return (%/yr)</label><input type="number" id="sip-rate" value="12" step="0.5"></div>
        <div class="input-group" style="flex:1;min-width:110px"><label>Duration (years)</label><input type="number" id="sip-years" value="15" min="1" max="40"></div>
        <div class="input-group" style="flex:1;min-width:130px"><label>Annual Step-Up (%)</label><input type="number" id="sip-step" value="10" min="0" max="50"></div>
      </div>
      <div class="result-stats mt-4" id="sip-stats"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px">
        <div><h4 style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:8px;text-align:center">Invested vs Returns</h4>
          <canvas id="sip-doughnut" style="width:100%;height:200px"></canvas><div id="sip-legend"></div></div>
        <div><h4 style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:8px;text-align:center">Wealth Growth</h4>
          <canvas id="sip-line" style="width:100%;height:200px"></canvas></div>
      </div>
      <div id="sip-insights"></div>
    </div>`;

    const calc = () => {
      const sipAmt = +document.getElementById('sip-amt').value;
      const rate = +document.getElementById('sip-rate').value / 100;
      const years = +document.getElementById('sip-years').value;
      const stepUp = +document.getElementById('sip-step').value / 100;
      const monthlyRate = rate / 12;

      let wealth = 0, invested = 0, currentSip = sipAmt;
      const wealthData = [0], investedData = [0], labels = ['Yr 0'];

      for (let yr = 1; yr <= years; yr++) {
        for (let m = 0; m < 12; m++) {
          wealth = (wealth + currentSip) * (1 + monthlyRate);
          invested += currentSip;
        }
        wealthData.push(wealth); investedData.push(invested); labels.push('Yr ' + yr);
        currentSip *= (1 + stepUp);
      }

      const returns = wealth - invested;
      document.getElementById('sip-stats').innerHTML = [
        ['Total Wealth', '₹' + Math.round(wealth).toLocaleString()],
        ['Amount Invested', '₹' + Math.round(invested).toLocaleString()],
        ['Wealth Gained', '₹' + Math.round(returns).toLocaleString()],
        ['Return Multiple', (wealth/Math.max(1,invested)).toFixed(1) + 'x']
      ].map(([l,v]) => `<div class="stat-card"><div class="stat-num" style="font-size:1rem">${v}</div><div class="stat-lbl">${l}</div></div>`).join('');

      Chart.drawDoughnut(document.getElementById('sip-doughnut'), [
        { value: invested, color: Chart.colors.primary, centerText: (wealth/Math.max(1,invested)).toFixed(1) + 'x' },
        { value: returns, color: Chart.colors.success }
      ]);
      document.getElementById('sip-legend').innerHTML = chartLegend([
        [Chart.colors.primary, 'Invested: ₹' + Chart.fmtNum(invested)],
        [Chart.colors.success, 'Returns: ₹' + Chart.fmtNum(returns)]
      ]);
      Chart.drawLine(document.getElementById('sip-line'), [
        { data: wealthData, color: Chart.colors.success },
        { data: investedData, color: Chart.colors.primary }
      ], labels);
      document.getElementById('sip-insights').innerHTML = insightBox(FinanceInsights.sip(wealth, invested, returns));
    };
    ['sip-amt','sip-rate','sip-years','sip-step'].forEach(id => document.getElementById(id).addEventListener('input', calc));
    calc();
  },

  // ===== RETIREMENT CALCULATOR =====
  'retirement-calculator'(c) {
    c.innerHTML = `<div class="tool-workspace-body">
      <div class="flex gap-4 flex-wrap">
        <div class="input-group" style="flex:1;min-width:120px"><label>Current Age</label><input type="number" id="ret-age" value="30" min="18" max="80"></div>
        <div class="input-group" style="flex:1;min-width:120px"><label>Retirement Age</label><input type="number" id="ret-retire" value="65" min="30" max="100"></div>
        <div class="input-group" style="flex:1;min-width:140px"><label>Current Savings ($)</label><input type="number" id="ret-savings" value="50000"></div>
        <div class="input-group" style="flex:1;min-width:140px"><label>Monthly Savings ($)</label><input type="number" id="ret-monthly" value="1000"></div>
      </div>
      <div class="flex gap-4 flex-wrap mt-2">
        <div class="input-group" style="flex:1"><label>Expected Return (%/yr)</label><input type="number" id="ret-return" value="7" step="0.5"></div>
        <div class="input-group" style="flex:1"><label>Inflation (%/yr)</label><input type="number" id="ret-inflation" value="3" step="0.5"></div>
        <div class="input-group" style="flex:1"><label>Monthly Need at Retirement ($)</label><input type="number" id="ret-need" value="4000"></div>
      </div>
      <div class="result-stats mt-4" id="ret-stats"></div>
      <div style="margin-top:20px"><h4 style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:8px;text-align:center">Retirement Savings Projection</h4>
        <canvas id="ret-chart" style="width:100%;height:250px"></canvas><div id="ret-legend"></div></div>
      <div id="ret-insights"></div>
    </div>`;

    const calc = () => {
      const currentAge = +document.getElementById('ret-age').value;
      const retireAge = +document.getElementById('ret-retire').value;
      const savings = +document.getElementById('ret-savings').value;
      const monthly = +document.getElementById('ret-monthly').value;
      const retRate = +document.getElementById('ret-return').value / 100;
      const inflation = +document.getElementById('ret-inflation').value / 100;
      const monthlyNeed = +document.getElementById('ret-need').value;
      const yearsToRetire = retireAge - currentAge;
      const monthlyRate = retRate / 12;

      let balance = savings;
      const data = [balance], labels = ['Age ' + currentAge];
      for (let yr = 1; yr <= yearsToRetire; yr++) {
        for (let m = 0; m < 12; m++) { balance = balance * (1 + monthlyRate) + monthly; }
        data.push(balance); labels.push('Age ' + (currentAge + yr));
      }

      const totalAtRetirement = balance;
      const inflatedNeed = monthlyNeed * Math.pow(1 + inflation, yearsToRetire);
      const neededCorpus = inflatedNeed * 12 * 25; // 4% rule
      const gap = neededCorpus - totalAtRetirement;
      const yearsOfIncome = totalAtRetirement / (inflatedNeed * 12);

      document.getElementById('ret-stats').innerHTML = [
        ['Savings at Retirement', '$' + Math.round(totalAtRetirement).toLocaleString()],
        ['Corpus Needed (4% rule)', '$' + Math.round(neededCorpus).toLocaleString()],
        ['Monthly Need (inflated)', '$' + Math.round(inflatedNeed).toLocaleString()],
        ['Years of Income', yearsOfIncome.toFixed(1) + ' years'],
        [gap > 0 ? '⚠️ Gap' : '✅ Surplus', '$' + Math.round(Math.abs(gap)).toLocaleString()]
      ].map(([l,v]) => `<div class="stat-card"><div class="stat-num" style="font-size:0.95rem">${v}</div><div class="stat-lbl">${l}</div></div>`).join('');

      // Needed line
      const neededData = data.map((_,i) => neededCorpus * (i / yearsToRetire));
      Chart.drawLine(document.getElementById('ret-chart'), [
        { data, color: Chart.colors.success },
        { data: neededData, color: Chart.colors.tertiary }
      ], labels);
      document.getElementById('ret-legend').innerHTML = chartLegend([
        [Chart.colors.success, 'Your Savings'], [Chart.colors.tertiary, 'Target Corpus']
      ]);
      document.getElementById('ret-insights').innerHTML = insightBox(FinanceInsights.retirement(neededCorpus, totalAtRetirement, gap));
    };
    ['ret-age','ret-retire','ret-savings','ret-monthly','ret-return','ret-inflation','ret-need'].forEach(id => document.getElementById(id).addEventListener('input', calc));
    calc();
  },

  // ===== ROI CALCULATOR =====
  'roi-calculator'(c) {
    c.innerHTML = `<div class="tool-workspace-body">
      <div class="flex gap-4 flex-wrap">
        <div class="input-group" style="flex:1;min-width:150px"><label>Initial Investment ($)</label><input type="number" id="roi-invest" value="10000"></div>
        <div class="input-group" style="flex:1;min-width:150px"><label>Final Value ($)</label><input type="number" id="roi-final" value="15000"></div>
        <div class="input-group" style="flex:1;min-width:120px"><label>Time Period (years)</label><input type="number" id="roi-years" value="3" min="0.1" step="0.5"></div>
      </div>
      <div class="result-stats mt-4" id="roi-stats"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px">
        <div><h4 style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:8px;text-align:center">Investment vs Return</h4>
          <canvas id="roi-bar" style="width:100%;height:200px"></canvas></div>
        <div><h4 style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:8px;text-align:center">Growth Projection</h4>
          <canvas id="roi-line" style="width:100%;height:200px"></canvas></div>
      </div>
      <div id="roi-insights" style="margin-top:20px;padding:16px;background:var(--bg-glass);border:1px solid var(--border-color);border-radius:var(--radius-lg)"></div>
    </div>`;

    const calc = () => {
      const invest = +document.getElementById('roi-invest').value;
      const final_ = +document.getElementById('roi-final').value;
      const years = +document.getElementById('roi-years').value;
      const profit = final_ - invest;
      const roi = (profit / invest * 100);
      const annualizedROI = (Math.pow(final_ / invest, 1 / years) - 1) * 100;

      const isProfit = profit >= 0;
      document.getElementById('roi-stats').innerHTML = [
        ['ROI', (isProfit?'+':'') + roi.toFixed(2) + '%'],
        ['Profit/Loss', (isProfit?'+$':'-$') + Math.abs(Math.round(profit)).toLocaleString()],
        ['Annualized ROI', annualizedROI.toFixed(2) + '%/yr'],
        ['Growth Multiple', (final_/invest).toFixed(2) + 'x']
      ].map(([l,v]) => `<div class="stat-card"><div class="stat-num" style="font-size:1rem;color:${isProfit?'var(--accent-success)':'var(--accent-tertiary)'}">${v}</div><div class="stat-lbl">${l}</div></div>`).join('');

      Chart.drawBar(document.getElementById('roi-bar'), [
        { label: 'Invested', value: invest, color: Chart.colors.primary },
        { label: 'Final Value', value: final_, color: isProfit ? Chart.colors.success : Chart.colors.tertiary },
        { label: isProfit ? 'Profit' : 'Loss', value: Math.abs(profit), color: isProfit ? Chart.colors.success : Chart.colors.tertiary }
      ]);

      const data = [], labels = [];
      for (let yr = 0; yr <= Math.ceil(years); yr++) {
        data.push(invest * Math.pow(1 + annualizedROI/100, yr)); labels.push('Yr ' + yr);
      }
      Chart.drawLine(document.getElementById('roi-line'), [{ data, color: isProfit ? Chart.colors.success : Chart.colors.tertiary }], labels);

      const phrases = isProfit ? [
        `🎉 Great investment! You earned $${Math.round(profit).toLocaleString()} profit.`,
        `📈 At ${annualizedROI.toFixed(1)}% annually, your money doubles in ~${Math.round(72/annualizedROI)} years (Rule of 72).`,
        annualizedROI > 10 ? '🏆 Outstanding! You beat the average S&P 500 annual return of ~10%.' : '📊 The S&P 500 averages ~10% annually — compare your returns.',
      ] : [
        `⚠️ You lost $${Math.abs(Math.round(profit)).toLocaleString()} on this investment.`,
        `💡 Losses are part of investing. Diversification can help reduce risk.`,
        `📊 Consider dollar-cost averaging to smooth out market volatility.`,
      ];
      document.getElementById('roi-insights').innerHTML = `<h4 style="font-size:0.9rem;margin-bottom:12px;color:var(--accent-primary)">💡 Investment Insights</h4>${phrases.map(p=>`<p style="font-size:0.85rem;color:var(--text-secondary);padding:4px 0;line-height:1.5">${p}</p>`).join('')}`;
    };
    ['roi-invest','roi-final','roi-years'].forEach(id => document.getElementById(id).addEventListener('input', calc));
    calc();
  },

  // ===== DEBT PAYOFF =====
  'debt-payoff'(c) {
    c.innerHTML = `<div class="tool-workspace-body">
      <div class="flex gap-4 flex-wrap">
        <div class="input-group" style="flex:1;min-width:150px"><label>Total Debt ($)</label><input type="number" id="dp-debt" value="25000"></div>
        <div class="input-group" style="flex:1;min-width:120px"><label>Interest Rate (%/yr)</label><input type="number" id="dp-rate" value="18" step="0.5"></div>
        <div class="input-group" style="flex:1;min-width:140px"><label>Monthly Payment ($)</label><input type="number" id="dp-payment" value="600"></div>
        <div class="input-group" style="flex:1;min-width:140px"><label>Extra Monthly ($)</label><input type="number" id="dp-extra" value="200"></div>
      </div>
      <div class="result-stats mt-4" id="dp-stats"></div>
      <div style="margin-top:20px"><h4 style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:8px;text-align:center">Debt Payoff Timeline</h4>
        <canvas id="dp-chart" style="width:100%;height:250px"></canvas><div id="dp-legend"></div></div>
      <div id="dp-insights" style="margin-top:20px;padding:16px;background:var(--bg-glass);border:1px solid var(--border-color);border-radius:var(--radius-lg)"></div>
    </div>`;

    const calc = () => {
      const debt = +document.getElementById('dp-debt').value;
      const rate = +document.getElementById('dp-rate').value / 100 / 12;
      const payment = +document.getElementById('dp-payment').value;
      const extra = +document.getElementById('dp-extra').value;

      // Without extra
      let bal1 = debt, months1 = 0, interest1 = 0;
      const data1 = [bal1];
      while (bal1 > 0 && months1 < 600) {
        const intPart = bal1 * rate; interest1 += intPart;
        bal1 = Math.max(0, bal1 + intPart - payment); months1++;
        if (months1 % 3 === 0) data1.push(bal1);
      }

      // With extra
      let bal2 = debt, months2 = 0, interest2 = 0;
      const data2 = [debt];
      while (bal2 > 0 && months2 < 600) {
        const intPart = bal2 * rate; interest2 += intPart;
        bal2 = Math.max(0, bal2 + intPart - payment - extra); months2++;
        if (months2 % 3 === 0) data2.push(bal2);
      }
      while (data2.length < data1.length) data2.push(0);

      const savedInterest = interest1 - interest2;
      const savedMonths = months1 - months2;
      const freeDate = new Date(); freeDate.setMonth(freeDate.getMonth() + months2);

      document.getElementById('dp-stats').innerHTML = [
        ['Payoff (min payment)', months1 + ' months'], ['Payoff (with extra)', months2 + ' months'],
        ['Time Saved', savedMonths + ' months'], ['Interest Saved', '$' + Math.round(savedInterest).toLocaleString()],
        ['Debt Free Date', freeDate.toLocaleDateString('en-US', {month:'short',year:'numeric'})]
      ].map(([l,v]) => `<div class="stat-card"><div class="stat-num" style="font-size:0.95rem">${v}</div><div class="stat-lbl">${l}</div></div>`).join('');

      const labels = data1.map((_,i) => 'Mo ' + (i*3));
      Chart.drawLine(document.getElementById('dp-chart'), [
        { data: data1, color: Chart.colors.tertiary },
        { data: data2, color: Chart.colors.success }
      ], labels);
      document.getElementById('dp-legend').innerHTML = chartLegend([
        [Chart.colors.tertiary, 'Minimum Payments'],
        [Chart.colors.success, 'With Extra $' + extra + '/mo']
      ]);

      document.getElementById('dp-insights').innerHTML = `<h4 style="font-size:0.9rem;margin-bottom:12px;color:var(--accent-primary)">💡 Debt Freedom Insights</h4>
        <p style="font-size:0.85rem;color:var(--text-secondary);padding:4px 0;line-height:1.5">🎯 Adding $${extra}/month saves you $${Math.round(savedInterest).toLocaleString()} in interest and ${savedMonths} months!</p>
        <p style="font-size:0.85rem;color:var(--text-secondary);padding:4px 0;line-height:1.5">📊 Total interest without extra: $${Math.round(interest1).toLocaleString()} vs with extra: $${Math.round(interest2).toLocaleString()}</p>
        <p style="font-size:0.85rem;color:var(--text-secondary);padding:4px 0;line-height:1.5">💡 Consider the Debt Avalanche method — pay highest interest debt first to save the most money.</p>
        <p style="font-size:0.85rem;color:var(--text-secondary);padding:4px 0;line-height:1.5">🏆 You'll be debt-free by ${freeDate.toLocaleDateString('en-US',{month:'long',year:'numeric'})}!</p>`;
    };
    ['dp-debt','dp-rate','dp-payment','dp-extra'].forEach(id => document.getElementById(id).addEventListener('input', calc));
    calc();
  },

  // ===== INFLATION CALCULATOR =====
  'inflation-calculator'(c) {
    c.innerHTML = `<div class="tool-workspace-body">
      <div class="flex gap-4 flex-wrap">
        <div class="input-group" style="flex:1;min-width:150px"><label>Amount Today ($)</label><input type="number" id="inf-amt" value="100000"></div>
        <div class="input-group" style="flex:1;min-width:130px"><label>Inflation Rate (%/yr)</label><input type="number" id="inf-rate" value="4" step="0.5" min="0"></div>
        <div class="input-group" style="flex:1;min-width:110px"><label>Years</label><input type="number" id="inf-years" value="20" min="1" max="50"></div>
      </div>
      <div class="result-stats mt-4" id="inf-stats"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px">
        <div><h4 style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:8px;text-align:center">Purchasing Power Decline</h4>
          <canvas id="inf-line" style="width:100%;height:220px"></canvas></div>
        <div><h4 style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:8px;text-align:center">Cost of Goods Over Time</h4>
          <canvas id="inf-bar" style="width:100%;height:220px"></canvas></div>
      </div>
      <div style="margin-top:20px;padding:16px;background:var(--bg-glass);border:1px solid var(--border-color);border-radius:var(--radius-lg)">
        <h4 style="font-size:0.9rem;margin-bottom:12px;color:var(--accent-primary)">📊 What Will Things Cost?</h4>
        <div id="inf-examples"></div>
      </div>
      <div id="inf-insights" style="margin-top:16px;padding:16px;background:var(--bg-glass);border:1px solid var(--border-color);border-radius:var(--radius-lg)"></div>
    </div>`;

    const calc = () => {
      const amt = +document.getElementById('inf-amt').value;
      const rate = +document.getElementById('inf-rate').value / 100;
      const years = +document.getElementById('inf-years').value;

      const futureValue = amt * Math.pow(1 + rate, years);
      const realValue = amt / Math.pow(1 + rate, years);
      const lostPower = amt - realValue;

      document.getElementById('inf-stats').innerHTML = [
        ['Purchasing Power', '$' + Math.round(realValue).toLocaleString()],
        ['Power Lost', '$' + Math.round(lostPower).toLocaleString() + ' (' + ((lostPower/amt)*100).toFixed(0) + '%)'],
        ['Need in ' + years + ' yrs', '$' + Math.round(futureValue).toLocaleString()],
        ['Effective Value', (realValue/amt*100).toFixed(0) + '¢ per $1']
      ].map(([l,v]) => `<div class="stat-card"><div class="stat-num" style="font-size:0.95rem">${v}</div><div class="stat-lbl">${l}</div></div>`).join('');

      // Line chart - purchasing power
      const data = [], labels = [];
      for (let yr = 0; yr <= years; yr++) {
        data.push(amt / Math.pow(1 + rate, yr));
        labels.push('Yr ' + yr);
      }
      Chart.drawLine(document.getElementById('inf-line'), [{ data, color: Chart.colors.tertiary }], labels);

      // Bar chart - costs at milestones
      const milestones = [5, 10, 15, 20, 25].filter(y => y <= years);
      const barData = milestones.map(yr => ({
        label: yr + ' yrs', value: amt * Math.pow(1 + rate, yr),
        color: yr <= 10 ? Chart.colors.warning : Chart.colors.tertiary
      }));
      barData.unshift({ label: 'Today', value: amt, color: Chart.colors.success });
      Chart.drawBar(document.getElementById('inf-bar'), barData);

      // Real world examples
      const items = [
        ['☕ Coffee', 5], ['🍔 Meal', 15], ['⛽ Gas (gallon)', 4],
        ['🏠 Rent', 1500], ['🎓 College/yr', 25000], ['💊 Healthcare/yr', 5000]
      ];
      document.getElementById('inf-examples').innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px">' +
        items.map(([name, price]) => {
          const future = (price * Math.pow(1 + rate, years)).toFixed(2);
          return `<div style="padding:10px;background:var(--bg-secondary);border-radius:var(--radius-md);display:flex;justify-content:space-between;align-items:center"><span style="font-size:0.85rem">${name}</span><div style="text-align:right"><div style="font-size:0.75rem;text-decoration:line-through;color:var(--text-tertiary)">$${price}</div><div style="font-size:0.9rem;font-weight:600;color:var(--accent-tertiary)">$${future}</div></div></div>`;
        }).join('') + '</div>';

      document.getElementById('inf-insights').innerHTML = `<h4 style="font-size:0.9rem;margin-bottom:12px;color:var(--accent-primary)">💡 Inflation Insights</h4>
        <p style="font-size:0.85rem;color:var(--text-secondary);padding:4px 0;line-height:1.5">📉 At ${(rate*100).toFixed(1)}% inflation, your $${amt.toLocaleString()} will only buy $${Math.round(realValue).toLocaleString()} worth of goods in ${years} years.</p>
        <p style="font-size:0.85rem;color:var(--text-secondary);padding:4px 0;line-height:1.5">💡 To beat inflation, your investments should earn at least ${(rate*100).toFixed(1)}% per year.</p>
        <p style="font-size:0.85rem;color:var(--text-secondary);padding:4px 0;line-height:1.5">🏆 Historically, stocks (S&P 500) average ~10% annually, well above average inflation of ~3%.</p>
        <p style="font-size:0.85rem;color:var(--text-secondary);padding:4px 0;line-height:1.5">⚠️ The "Rule of 72": At ${(rate*100).toFixed(0)}% inflation, prices double every ${Math.round(72/(rate*100))} years.</p>`;
    };
    ['inf-amt','inf-rate','inf-years'].forEach(id => document.getElementById(id).addEventListener('input', calc));
    calc();
  },

  // ===== PERCENTAGE (UPGRADED) =====
  'percentage-calculator'(c) {
    c.innerHTML = `<div class="tool-workspace-body">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
        <!-- What is X% of Y -->
        <div style="padding:16px;background:var(--bg-secondary);border-radius:var(--radius-md)">
          <h4 style="margin-bottom:12px;font-size:0.9rem">What is X% of Y?</h4>
          <div class="flex gap-2 align-center">
            <input type="number" id="pct-1-x" placeholder="X" value="20" style="width:80px;padding:8px;border-radius:6px;border:1px solid var(--border-color);background:var(--bg-glass);color:#fff">
            <span>% of</span>
            <input type="number" id="pct-1-y" placeholder="Y" value="150" style="width:100px;padding:8px;border-radius:6px;border:1px solid var(--border-color);background:var(--bg-glass);color:#fff">
            <span>= <strong id="pct-1-res" style="color:var(--accent-primary);font-size:1.1rem">30</strong></span>
          </div>
        </div>
        <!-- X is what % of Y -->
        <div style="padding:16px;background:var(--bg-secondary);border-radius:var(--radius-md)">
          <h4 style="margin-bottom:12px;font-size:0.9rem">X is what % of Y?</h4>
          <div class="flex gap-2 align-center">
            <input type="number" id="pct-2-x" placeholder="X" value="30" style="width:80px;padding:8px;border-radius:6px;border:1px solid var(--border-color);background:var(--bg-glass);color:#fff">
            <span>is what % of</span>
            <input type="number" id="pct-2-y" placeholder="Y" value="150" style="width:100px;padding:8px;border-radius:6px;border:1px solid var(--border-color);background:var(--bg-glass);color:#fff">
            <span>= <strong id="pct-2-res" style="color:var(--accent-secondary);font-size:1.1rem">20%</strong></span>
          </div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px">
        <!-- Increase/Decrease -->
        <div style="padding:16px;background:var(--bg-secondary);border-radius:var(--radius-md)">
          <h4 style="margin-bottom:12px;font-size:0.9rem">Percentage Increase/Decrease</h4>
          <div class="flex gap-2 align-center">
            <span>From</span>
            <input type="number" id="pct-3-x" placeholder="X" value="100" style="width:80px;padding:8px;border-radius:6px;border:1px solid var(--border-color);background:var(--bg-glass);color:#fff">
            <span>to</span>
            <input type="number" id="pct-3-y" placeholder="Y" value="120" style="width:80px;padding:8px;border-radius:6px;border:1px solid var(--border-color);background:var(--bg-glass);color:#fff">
            <span>= <strong id="pct-3-res" style="color:var(--accent-success);font-size:1.1rem">+20%</strong></span>
          </div>
        </div>
        <div style="display:flex;align-items:center;justify-content:center">
          <canvas id="pct-visual" style="width:100%;height:100px"></canvas>
        </div>
      </div>
      <div id="pct-insights" style="margin-top:20px;padding:16px;background:var(--bg-glass);border:1px solid var(--border-color);border-radius:var(--radius-lg)"></div>
    </div>`;

    const calc = () => {
      // Calc 1
      const x1 = +document.getElementById('pct-1-x').value;
      const y1 = +document.getElementById('pct-1-y').value;
      const res1 = (x1 / 100) * y1;
      document.getElementById('pct-1-res').textContent = isNaN(res1) ? '-' : +res1.toFixed(4);

      // Calc 2
      const x2 = +document.getElementById('pct-2-x').value;
      const y2 = +document.getElementById('pct-2-y').value;
      const res2 = (x2 / y2) * 100;
      document.getElementById('pct-2-res').textContent = isNaN(res2) || !isFinite(res2) ? '-' : (+res2.toFixed(4)) + '%';

      // Calc 3
      const x3 = +document.getElementById('pct-3-x').value;
      const y3 = +document.getElementById('pct-3-y').value;
      const diff = y3 - x3;
      const res3 = (diff / Math.abs(x3)) * 100;
      const sign = res3 > 0 ? '+' : '';
      const color = res3 > 0 ? 'var(--accent-success)' : res3 < 0 ? 'var(--accent-tertiary)' : 'var(--text-primary)';
      const el3 = document.getElementById('pct-3-res');
      el3.textContent = isNaN(res3) || !isFinite(res3) ? '-' : sign + (+res3.toFixed(4)) + '%';
      el3.style.color = color;

      // Visual Doughnut based on Calc 2
      if (!isNaN(res2) && isFinite(res2) && res2 <= 100 && res2 >= 0) {
        Chart.drawDoughnut(document.getElementById('pct-visual'), [
          { value: res2, color: Chart.colors.secondary, centerText: Math.round(res2)+'%' },
          { value: 100 - res2, color: Chart.colors.grid }
        ]);
      }

      const fraction = Math.round(100/res2);
      const isCleanFract = Math.abs((100/res2) - fraction) < 0.1;
      document.getElementById('pct-insights').innerHTML = `<h4 style="font-size:0.9rem;margin-bottom:12px;color:var(--accent-primary)">💡 Math Insights</h4>
        <p style="font-size:0.85rem;color:var(--text-secondary);padding:4px 0;line-height:1.5">🔄 <strong>Trick:</strong> Percentages are reversible. ${x1}% of ${y1} is exactly the same as ${y1}% of ${x1}.</p>
        ${isCleanFract && fraction > 1 ? `<p style="font-size:0.85rem;color:var(--text-secondary);padding:4px 0;line-height:1.5">🥧 <strong>Fraction:</strong> ${(+res2.toFixed(1))}% is roughly 1/${fraction} of the total amount.</p>` : ''}
        <p style="font-size:0.85rem;color:var(--text-secondary);padding:4px 0;line-height:1.5">📈 <strong>Change:</strong> A $${x3} item moving to $${y3} represents a ${sign}${Math.abs(+res3.toFixed(1))}% ${res3 > 0 ? 'increase' : 'decrease'}.</p>`;
    };
    ['pct-1-x','pct-1-y','pct-2-x','pct-2-y','pct-3-x','pct-3-y'].forEach(id => document.getElementById(id).addEventListener('input', calc));
    calc();
  },

  // ===== AGE (UPGRADED) =====
  'age-calculator'(c) {
    c.innerHTML = `<div class="tool-workspace-body">
      <div class="flex gap-4 flex-wrap">
        <div class="input-group" style="flex:1;min-width:200px"><label>Date of Birth</label><input type="date" id="age-dob" value="1995-06-15"></div>
        <div class="input-group" style="flex:1;min-width:200px"><label>Calculate age at</label><input type="date" id="age-target"></div>
      </div>
      <div class="result-stats mt-4" id="age-stats"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px">
        <div><h4 style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:8px;text-align:center">Year Progress</h4>
          <canvas id="age-doughnut" style="width:100%;height:180px"></canvas></div>
        <div id="age-insights" style="padding:16px;background:var(--bg-glass);border:1px solid var(--border-color);border-radius:var(--radius-lg)"></div>
      </div>
    </div>`;

    document.getElementById('age-target').valueAsDate = new Date();

    const calc = () => {
      const dob = new Date(document.getElementById('age-dob').value);
      const tgt = new Date(document.getElementById('age-target').value);
      if(isNaN(dob) || isNaN(tgt)) return;

      let yrs = tgt.getFullYear() - dob.getFullYear();
      let mos = tgt.getMonth() - dob.getMonth();
      let days = tgt.getDate() - dob.getDate();
      if(days < 0) { mos--; const d = new Date(tgt.getFullYear(), tgt.getMonth(), 0); days += d.getDate(); }
      if(mos < 0) { yrs--; mos += 12; }

      const totalDays = Math.floor((tgt - dob)/(1000*60*60*24));
      const totalWeeks = Math.floor(totalDays/7);
      const totalMos = yrs*12 + mos;

      let nextBday = new Date(tgt.getFullYear(), dob.getMonth(), dob.getDate());
      if(nextBday < tgt && nextBday.getDate() !== tgt.getDate()) {
        nextBday.setFullYear(tgt.getFullYear() + 1);
      }
      const daysToBday = Math.ceil((nextBday - tgt)/(1000*60*60*24));

      document.getElementById('age-stats').innerHTML = [
        ['Exact Age', yrs+'y '+mos+'m '+days+'d'],
        ['Total Months', totalMos.toLocaleString()],
        ['Total Weeks', totalWeeks.toLocaleString()],
        ['Total Days', totalDays.toLocaleString()]
      ].map(([l,v]) => `<div class="stat-card"><div class="stat-num" style="font-size:1rem">${v}</div><div class="stat-lbl">${l}</div></div>`).join('');

      Chart.drawDoughnut(document.getElementById('age-doughnut'), [
        { value: 365 - daysToBday, color: Chart.colors.primary, centerText: yrs + ' Years' },
        { value: daysToBday, color: Chart.colors.grid }
      ]);

      const milestones = [10000, 20000, 30000];
      const nextMilestone = milestones.find(m => m > totalDays);
      const msDate = new Date(dob);
      if (nextMilestone) msDate.setDate(msDate.getDate() + nextMilestone);

      document.getElementById('age-insights').innerHTML = `<h4 style="font-size:0.9rem;margin-bottom:12px;color:var(--accent-primary)">💡 Fun Facts</h4>
        <p style="font-size:0.85rem;color:var(--text-secondary);padding:4px 0;line-height:1.5">🎂 Your next birthday is in <strong>${daysToBday} days</strong> on ${nextBday.toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'})}.</p>
        <p style="font-size:0.85rem;color:var(--text-secondary);padding:4px 0;line-height:1.5">🫀 Your heart has beaten approximately <strong>${Chart.fmtNum(totalDays * 100000)}</strong> times.</p>
        ${nextMilestone ? `<p style="font-size:0.85rem;color:var(--text-secondary);padding:4px 0;line-height:1.5">🏆 You will reach <strong>${nextMilestone.toLocaleString()} days</strong> old on ${msDate.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}.</p>` : ''}`;
    };
    ['age-dob','age-target'].forEach(id => document.getElementById(id).addEventListener('change', calc));
    calc();
  },

  // ===== TIP (UPGRADED) =====
  'tip-calculator'(c) {
    c.innerHTML = `<div class="tool-workspace-body">
      <div class="flex gap-4 flex-wrap">
        <div class="input-group" style="flex:1;min-width:140px"><label>Bill Amount ($)</label><input type="number" id="tip-bill" value="120.50"></div>
        <div class="input-group" style="flex:1;min-width:140px"><label>Tip Percentage (%)</label><input type="number" id="tip-pct" value="18" min="0"></div>
        <div class="input-group" style="flex:1;min-width:140px"><label>Number of People</label><input type="number" id="tip-ppl" value="3" min="1"></div>
      </div>
      <div class="flex gap-2 mt-2" id="tip-presets">
        ${[10,15,18,20,25].map(p=>`<button class="btn btn-secondary" style="padding:6px 12px;min-width:0" data-pct="${p}">${p}%</button>`).join('')}
      </div>
      <div class="result-stats mt-4" id="tip-stats"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px">
        <div><h4 style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:8px;text-align:center">Bill Composition</h4>
          <canvas id="tip-doughnut" style="width:100%;height:180px"></canvas></div>
        <div id="tip-insights" style="padding:16px;background:var(--bg-glass);border:1px solid var(--border-color);border-radius:var(--radius-lg)"></div>
      </div>
    </div>`;

    document.querySelectorAll('#tip-presets button').forEach(b => {
      b.addEventListener('click', () => { document.getElementById('tip-pct').value = b.dataset.pct; calc(); });
    });

    const calc = () => {
      const bill = +document.getElementById('tip-bill').value;
      const pct = +document.getElementById('tip-pct').value;
      const ppl = +document.getElementById('tip-ppl').value || 1;
      const tip = bill * (pct/100);
      const total = bill + tip;
      const perTip = tip / ppl;
      const perTotal = total / ppl;

      document.getElementById('tip-stats').innerHTML = [
        ['Total Tip', '$'+tip.toFixed(2)],
        ['Total Bill', '$'+total.toFixed(2)],
        ['Tip per Person', '$'+perTip.toFixed(2)],
        ['Total per Person', '$'+perTotal.toFixed(2)]
      ].map(([l,v]) => `<div class="stat-card"><div class="stat-num" style="font-size:1.1rem;color:var(--accent-success)">${v}</div><div class="stat-lbl">${l}</div></div>`).join('');

      Chart.drawDoughnut(document.getElementById('tip-doughnut'), [
        { value: bill, color: Chart.colors.secondary, centerText: '$' + Math.round(total) },
        { value: tip, color: Chart.colors.success }
      ]);

      let quality = pct < 15 ? 'Below Average' : pct <= 18 ? 'Good' : pct <= 20 ? 'Great' : 'Exceptional';
      document.getElementById('tip-insights').innerHTML = `<h4 style="font-size:0.9rem;margin-bottom:12px;color:var(--accent-primary)">💡 Tipping Guide</h4>
        <p style="font-size:0.85rem;color:var(--text-secondary);padding:4px 0;line-height:1.5">🍽️ You are leaving an <strong>${quality}</strong> tip. The standard US restaurant tip is 15-20%.</p>
        <p style="font-size:0.85rem;color:var(--text-secondary);padding:4px 0;line-height:1.5">🤝 You are adding $${(tip/Math.max(1,bill)*100).toFixed(1)} cents for every dollar on the bill.</p>
        <p style="font-size:0.85rem;color:var(--text-secondary);padding:4px 0;line-height:1.5">📈 If you rounded up to the nearest dollar, the total would be <strong>$${Math.ceil(total).toFixed(2)}</strong>.</p>`;
    };
    ['tip-bill','tip-pct','tip-ppl'].forEach(id => document.getElementById(id).addEventListener('input', calc));
    calc();
  },

  // ===== BMI (UPGRADED) =====
  'bmi-calculator'(c) {
    c.innerHTML = `<div class="tool-workspace-body">
      <div class="flex gap-4 flex-wrap">
        <div class="input-group" style="flex:1;min-width:140px">
          <label>Height</label>
          <div class="flex gap-2">
            <input type="number" id="bmi-ft" value="5" placeholder="ft">
            <input type="number" id="bmi-in" value="9" placeholder="in">
          </div>
        </div>
        <div class="input-group" style="flex:1;min-width:140px"><label>Weight (lbs)</label><input type="number" id="bmi-lbs" value="160"></div>
      </div>
      <div class="result-stats mt-4" id="bmi-stats"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px">
        <div><h4 style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:8px;text-align:center">BMI Category</h4>
          <canvas id="bmi-doughnut" style="width:100%;height:180px"></canvas></div>
        <div id="bmi-insights" style="padding:16px;background:var(--bg-glass);border:1px solid var(--border-color);border-radius:var(--radius-lg)"></div>
      </div>
    </div>`;

    const calc = () => {
      const ft = +document.getElementById('bmi-ft').value || 0;
      const inc = +document.getElementById('bmi-in').value || 0;
      const lbs = +document.getElementById('bmi-lbs').value || 0;
      const totalInches = (ft * 12) + inc;

      if(totalInches > 0 && lbs > 0) {
        const bmi = (lbs / (totalInches * totalInches)) * 703;
        let cat = '', bcol = '';
        if(bmi < 18.5) { cat = 'Underweight'; bcol = Chart.colors.secondary; }
        else if(bmi < 25) { cat = 'Normal Weight'; bcol = Chart.colors.success; }
        else if(bmi < 30) { cat = 'Overweight'; bcol = Chart.colors.warning; }
        else { cat = 'Obese'; bcol = Chart.colors.tertiary; }

        const normalMin = (18.5 * totalInches * totalInches) / 703;
        const normalMax = (24.9 * totalInches * totalInches) / 703;

        document.getElementById('bmi-stats').innerHTML = [
          ['Your BMI', bmi.toFixed(1)],
          ['Category', cat],
          ['Normal Weight Range', Math.round(normalMin) + ' - ' + Math.round(normalMax) + ' lbs']
        ].map(([l,v], i) => `<div class="stat-card"><div class="stat-num" style="font-size:${i===0?'1.3rem':'1rem'};color:${i===0?bcol:'inherit'}">${v}</div><div class="stat-lbl">${l}</div></div>`).join('');

        Chart.drawDoughnut(document.getElementById('bmi-doughnut'), [
          { value: 18.5, color: Chart.colors.secondary },
          { value: 6.4, color: Chart.colors.success },
          { value: 5, color: Chart.colors.warning },
          { value: 10, color: Chart.colors.tertiary, centerText: bmi.toFixed(1) }
        ]);

        let msg = cat === 'Normal Weight' ? '🎉 Great job! You are in the healthy weight range.' : 
                  cat === 'Underweight' ? `⚠️ You are approximately ${Math.round(normalMin - lbs)} lbs below the normal weight range.` : 
                  `⚠️ You are approximately ${Math.round(lbs - normalMax)} lbs above the normal weight range.`;

        document.getElementById('bmi-insights').innerHTML = `<h4 style="font-size:0.9rem;margin-bottom:12px;color:var(--accent-primary)">💡 Health Insights</h4>
          <p style="font-size:0.85rem;color:var(--text-secondary);padding:4px 0;line-height:1.5">${msg}</p>
          <p style="font-size:0.85rem;color:var(--text-secondary);padding:4px 0;line-height:1.5">📊 BMI is a useful screening tool, but it does not measure body fat directly. Muscle mass can affect accuracy.</p>
          <p style="font-size:0.85rem;color:var(--text-secondary);padding:4px 0;line-height:1.5">👨‍⚕️ Always consult a healthcare provider for a thorough health assessment.</p>`;
      }
    };
    ['bmi-ft','bmi-in','bmi-lbs'].forEach(id => document.getElementById(id).addEventListener('input', calc));
    calc();
  },

});
