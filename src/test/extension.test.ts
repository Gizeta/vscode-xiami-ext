import * as assert from 'assert';
import * as utils from '../utils';
import * as request from 'request';
import * as lame from 'lame';
import Speaker from '@gizeta/speaker';

suite("Extension Tests", function () {
  test("Something 1", function() {
    assert.equal(-1, [1, 2, 3].indexOf(5));
    assert.equal(-1, [1, 2, 3].indexOf(0));
  });

  test("sign", function() {
    assert.equal(
      "https://www.xiami.com/api/recommend/getDailySongs?_s=d9c011ef03ef2b978fd9c4f1d23afc13",
      utils.getApiUrl("/api/recommend/getDailySongs", "", {
        getCookieString() {
          return "gid=153837556469388; xm_sg_tk=70661993bc8252c8e74b79a89052073f_1549870209888; xm_sg_tk.sig=igLdx2o7vC3ae5WMed4bntqIxxr7qd87q2xxy_0Z8_s; xm_token=7dc741065e5169a1e2698476968f0488; xmgid=70e6f53b-c872-4cb9-a8f2-5bda36313c0f; _uab_collina=154985355463779732994646; _xm_ncoToken_login=web_login_1549868354801_0.5624893016157142; cna=; uidXM=8313255; isg=BDg4V3F6kPrMNPtzIwKl5pMbCuDA_SYnISLAVHKphHMmjdh3GrFsu06vQUWYxlQD; l=bBMQLIMPvzJwwcPyBOCahurza77OSIOYYuPzaNbMi_5CP6T1gI_OloG09F96Vs5RssYB4i5Wivp9-etXq; _xm_umtoken=TB1F2F2D90E4AC816B3869D50795AE9DDCC7137DEA946A6D7230A051862;";
        }
      })
    );
  });

  test("speaker", async function() {
    this.timeout(60000);
    await assert.doesNotReject(function() {
      const stream = request.get('http://file-examples.com/wp-content/uploads/2017/11/file_example_MP3_700KB.mp3');
      const decoder = new lame.Decoder();
      const speaker = new Speaker();

      stream.pipe(decoder).pipe(speaker);

      return new Promise((resolve, reject) => {
        stream.on("error", (e) => {
          reject(e);
        });
        speaker.on("error", (e) => {
          reject(e);
        });
        speaker.on("close", () => {
          resolve();
        });
      });
    });
  });
});
