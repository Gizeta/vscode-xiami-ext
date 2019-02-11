import * as request from 'request';
import * as lame from 'lame';
import Speaker from '@gizeta/speaker';
import { EventEmitter } from 'events';

interface Track {
  order: number;
  id: number;
  name: string;
  album: string;
  artist: string;
  duration: string;
  url: () => string;
}

class TrackPlayer extends EventEmitter  {
  private request: request.Request | null = null;
  private decoder: lame.Decoder | null = null;
  private speaker: Speaker | null = null;

  play(url: string) {
    this.decoder = new lame.Decoder();
    this.speaker = new Speaker();
    this.request = request(url);
    this.request.pipe(this.decoder).pipe(this.speaker);
    this.speaker.on('close', () => {
      this.stop();
    });
    this.emit('play');
  }

  pause() {
    if (this.request) {
      this.request.pause();
      this.decoder.unpipe();
      this.emit('pause');
    }
  }

  resume() {
    if (this.request) {
      this.decoder.pipe(this.speaker);
      this.request.resume();
      this.emit('resume');
    }
  }

  stop() {
    if (this.decoder) {
      this.decoder.unpipe();
      if (this.request) {
        this.request.abort();
        this.request.removeAllListeners();
      }
    }
    this.request = null;
    this.decoder = null;
    this.speaker = null;
    this.emit('stop');
  }
}

export default class Player extends EventEmitter {
  private trackList: Track[] = [];
  private player: TrackPlayer;
  private current: number = 0;
  public state: 'playing' | 'stopped' | 'paused' = 'stopped';

  constructor() {
    super();
    this.player = new TrackPlayer();
    ['play', 'pause', 'resume'].forEach(event => {
      this.player.on(event, () => {
        this.emit(event, {
          track: this.trackList[this.current]
        });
      });
    });
    this.player.on('stop', () => {
      if (this.current + 1 < this.trackList.length) {
        this.play((this.current + 1) % this.trackList.length);
      } else {
        this.emit('stop');
      }
    });
  }

  getTrackList() {
    return this.trackList;
  }

  setTrackList(list: any[], download) {
    let i = 0;
    this.trackList = list.map(t => ({
      order: i++,
      id: t.songId,
      name: t.songName,
      album: t.albumName,
      duration: t.length,
      artist: t.singers,
      url: () => download(t.songId)
    }));
    this.current = 0;
  }

  async play(current: number | void = undefined) {
    if (this.trackList.length === 0) { return; }
    if (current && this.current !== current) {
      if (this.state !== 'stopped') {
        this.state = 'stopped';
        this.player.stop();
      }
      this.current = current!;
    }

    if (this.state === 'playing') {
      return;
    } else if (this.state === 'paused') {
      this.state = 'playing';
      this.player.resume();
    } else {
      this.state = 'playing';
      this.player.play(await this.trackList[this.current].url());
    }
  }

  pause() {
    if (this.state === 'playing') {
      this.state = 'paused';
      this.player.pause();
    }
  }

  stop() {
    if (this.state !== 'stopped') {
      this.state = 'stopped';
      this.current = 0;
      this.player.stop();
    }
  }

  destroy() {
    this.player.stop();
    this.player.removeAllListeners();
  }
}
