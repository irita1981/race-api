const express = require('express');
const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');
const app = express();

app.get('/race-data', async (req, res) => {
  const { place_no, race_no, hiduke, narabikae } = req.query;

  if (!place_no || !race_no || !hiduke) {
    return res.status(400).json({ error: 'place_no, race_no, hiduke を指定してください' });
  }

  const url = `https://kyoteibiyori.com/race_shusso.php?place_no=${place_no}&race_no=${race_no}&hiduke=${hiduke}&slider=1`;

  try {
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
});


    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    // ✅ 並び替えコードが指定されていれば入力してボタンを押す
    if (narabikae && /^\d{6}$/.test(narabikae)) {
        await page.screenshot({ path: 'before_narabikae.png', fullPage: true });
        // 要素が出現するまで待つ
        await page.waitForSelector('#txtNarabikae', { timeout: 10000 });

        // 並び替え前の順番を取得
        const beforeOrder = await page.$$eval('td.btnPlayer', els =>
            els.slice(0, 6).map(el => el.getAttribute('data-course'))
            );
        
        // 並び替えコードを入力してボタンを押す
        await page.waitForSelector('#txtNarabikae');
        await page.evaluate((code) => {
            const input = document.querySelector('#txtNarabikae');
            if (input) input.value = code;
            }, narabikae);
        await page.screenshot({ path: 'after1_narabikae.png', fullPage: true });
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('span.common_btn'));
            const btn = btns.find(el => el.textContent.trim() === '変更');
            if (btn) {
                btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            }
        });
        await new Promise(resolve => setTimeout(resolve, 1500));

        await page.screenshot({ path: 'after2_narabikae.png', fullPage: true });
    }

    // ✅ データ抽出処理（そのまま）
    const structuredData = await page.evaluate(() => {
      const cells = Array.from(document.querySelectorAll('td.btnPlayer')).slice(0, 18);
      const players = [];
      for (let i = 0; i < 6; i++) {
        players.push({
          id: cells[i]?.getAttribute('id') || '',
          course: cells[i]?.getAttribute('data-shinnyuu') || '',
          boat: cells[i]?.getAttribute('data-course') || '',
          name: cells[i]?.getAttribute('data-player_name') || '',
          stats: {}
        });
      }

      const targets = {
        '1着率': ['今期', '直近6ヶ月', '直近3ヶ月', '直近1ヶ月', '当地'],
        '2連対率': ['今期', '直近6ヶ月', '直近3ヶ月', '直近1ヶ月', '当地'],
        '3連対率': ['今期', '直近6ヶ月', '直近3ヶ月', '直近1ヶ月', '当地'],
        '枠別勝率': ['直近1年', '直近6ヵ月'],
        '平均ST': ['今期', '直近6ヶ月', '直近3ヶ月', '直近1ヶ月', '当地', 'F持'],
        'ST順位': ['今期', '直近6ヶ月', '直近3ヶ月', '直近1ヶ月', '当地', 'F持']
      };

      const rows = Array.from(document.querySelectorAll('tr'));
      let currentLabel = null;

      for (let i = 0; i < rows.length; i++) {
        const tds = Array.from(rows[i].querySelectorAll('td'));
        if (tds.length === 1 && tds[0].getAttribute('colspan') === '7') {
          currentLabel = tds[0].textContent.trim();
        } else if (tds.length === 7 && currentLabel) {
          const period = tds[0].textContent.trim();
          if (targets[currentLabel]?.some(p => period.includes(p))) {
            for (let j = 1; j <= 6; j++) {
              const text = tds[j]?.textContent.trim().replace(/\n/g, ' ') || '';
              let value = null;

              if (currentLabel.includes('着率') || currentLabel.includes('勝率')) {
                const match = text.match(/([\d.]+)%\s*\(?(\d+)\)?/);
                value = match ? {
                  rate: match[1] + '%',
                  starts: parseInt(match[2])
                } : { rate: null, starts: null };
              } else {
                value = text || null;
              }

              players[j - 1].stats[`${period}_${currentLabel}`] = value;
            }
          }
        }
      }

      return players;
    });

    res.json(structuredData);
    await browser.close();
  } catch (error) {
    console.error('スクレイピング失敗:', error);
    res.status(500).json({ error: 'スクレイピングに失敗しました' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ APIサーバーが http://localhost:${PORT}/race-data で起動中`);
});