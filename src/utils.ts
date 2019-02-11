import * as crypto from 'crypto';

export function getApiUrl(url, params, cookies) {
  const sg_token = cookies.getCookieString('https://xiami.com/').match(/(?:^|;\s*)xm_sg_tk=([^;]*)/)[1];
  const hash = crypto.createHash('md5').update(`${sg_token.split('_')[0]}_xmMain_${url}_${params}`).digest('hex');
  return `https://www.xiami.com${url}?_s=${hash}${params ? `&_q=${params}` : ''}`;
}
