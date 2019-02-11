import * as request from 'request';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import FileCookieStore = require('tough-cookie-filestore');
import * as utils from './utils';

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36';
const COOKIE_FILE = path.resolve(os.tmpdir(), 'vsc.xiamiext.cookie');

function checkCookie() {
  return (target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<(...params) => Promise<any>>) => {
    let oldFunc = descriptor.value!;
    descriptor.value = async function (...params) {
      if (!(this as ApiHost).cookies.getCookieString('https://xiami.com/').includes('xm_sg_tk')) {
        await new Promise((resolve, _) => {
          request.get({
            url: 'https://www.xiami.com/',
            jar: (this as ApiHost).cookies
          }, () => {
            resolve();
          });
        });
      }
      return await oldFunc.apply(this, params);
    };
  };
}

export default class ApiHost {
  public cookies: request.CookieJar;

  constructor() {
    if (!fs.existsSync(COOKIE_FILE)) {
      fs.writeFileSync(COOKIE_FILE, '');
    }
    this.cookies = request.jar(new FileCookieStore(COOKIE_FILE));
  }

  setToken(token: string) {
    this.cookies.setCookie(`xm_token=${token}`, 'https://www.xiami.com/');
  }

  @checkCookie()
  async fetchRecommend(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      request.get({
        url: utils.getApiUrl('/api/recommend/getDailySongs', '', this.cookies),
        headers: {
          'User-Agent': USER_AGENT,
          'Referer': 'https://www.xiami.com/'
        },
        jar: this.cookies,
        json: true
      }, (err, _, body) => {
        if (err) {
          reject(new Error(err));
        }
        
        if (body.code !== 'SUCCESS') {
          reject(new Error(body.msg));
        }
        resolve(body.result.data.songs);
      });
    });
  }

  @checkCookie()
  async fetchTrackUrl(id: number): Promise<any> {
    return new Promise((resolve, reject) => {
      request.get({
        url: utils.getApiUrl('/api/song/getPlayInfo', `{"songIds":[${id}]}`, this.cookies),
        headers: {
          'User-Agent': USER_AGENT,
          'Referer': 'https://www.xiami.com/'
        },
        jar: this.cookies,
        json: true
      }, (err, _, body) => {
        if (err) {
          reject(new Error(err));
        }
        
        if (body.code !== 'SUCCESS') {
          reject(new Error(body.msg));
        }
        resolve(body.result.data.songPlayInfos[0].playInfos[0].listenFile);
      });
    });
  }
}