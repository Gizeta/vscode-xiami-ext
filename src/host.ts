import * as vscode from 'vscode';
import ApiHost from './api';
import Player from './player';

interface StatusBarControls {
  play: vscode.StatusBarItem;
  text: vscode.StatusBarItem;
}

export default class ExtensionHost {
  private apiHost: ApiHost;
  private player: Player;
  private controls: StatusBarControls;

  constructor(private context: vscode.ExtensionContext) {
    this.apiHost = new ApiHost();
    this.player = new Player();

    const token = this.context.globalState.get<string>('xiamiext.token');
    if (token) {
      this.apiHost.setToken(token);
    }

    this.controls = this.initControls(context);

    this.player.on('play', ({ track }) => {
      this.controls.play.text = '$(primitive-square)';
      this.controls.play.tooltip = 'pause';
      this.controls.text.text = `${track.name} - ${track.album}`;
    });
    this.player.on('resume', () => {
      this.controls.play.text = '$(primitive-square)';
      this.controls.play.tooltip = 'pause';
    });
    this.player.on('pause', () => {
      this.controls.play.text = '$(triangle-right)';
      this.controls.play.tooltip = 'play';
    });
    this.player.on('stop', () => {
      this.controls.play.text = '$(triangle-right)';
      this.controls.play.tooltip = 'play';
      this.controls.text.text = '';
    });
  }

  private initControls(context: vscode.ExtensionContext): StatusBarControls {
    context.subscriptions.push(
      vscode.commands.registerCommand('xiamiext.login', async () => {
        let token = await vscode.window.showInputBox({
          prompt: '虾米账号token',
          placeHolder: 'xm_token'
        });
        if (!token) { return; }
  
        await this.setToken(token);
      }),
      vscode.commands.registerCommand('xiamiext.recommend', async () => {
        await this.showRecommendList();
      }),
      vscode.commands.registerCommand('xiamiext.list', async () => {
        await this.showTrackList();
      })
    );
  
    const playIcon = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 139);
    playIcon.command = 'xiamiext.play';
    context.subscriptions.push(
      playIcon,
      vscode.commands.registerCommand('xiamiext.play', () => {
        this.togglePlaying();
      })
    );
    playIcon.show();
  
    const currentPlaying = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 137);
    currentPlaying.command = 'xiamiext.list';
    currentPlaying.text = '';
    currentPlaying.show();
    context.subscriptions.push(currentPlaying);
  
    return {
      play: playIcon,
      text: currentPlaying
    };
  }

  private setToken(token: string) {
    this.context.globalState.update('xiamiext.token', token);
    this.apiHost.setToken(token);
  }

  private async showRecommendList() {
    try {
      this.player.setTrackList(await this.apiHost.fetchRecommend(), this.apiHost.fetchTrackUrl.bind(this.apiHost));
    } catch (err) {
      vscode.window.showErrorMessage(err.message);
      return;
    }
    
    await this.showTrackList();
  }
  
  private async showTrackList() {
    let chosen = await vscode.window.showQuickPick(this.player.getTrackList().map(t => {
      return {
        id: t.order,
        label: t.name,
        description: ` ${t.album} / ${t.artist}`
      };
    }), {
      canPickMany: false
    });
    if (chosen) {
      this.player.play(chosen.id);
    }
  }

  private togglePlaying() {
    if (this.player.state === 'playing') {
      this.player.pause();
    } else {
      this.player.play();
    }
  }

  destroy() {
    this.player.destroy();
    this.player.removeAllListeners();
  }
}
