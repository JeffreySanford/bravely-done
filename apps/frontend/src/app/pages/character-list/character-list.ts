import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthStateService } from '../../core/auth-state.service';
import { CharacterApiService } from '../../core/character-api.service';
import { CharacterDto } from '../../api/models/character-dto';
import { detectMotionMode } from '../../game-rendering/motion-mode';
import { RendererLifecycle } from '../../game-rendering/renderer-lifecycle';
import { isWebglAvailable } from '../../game-rendering/webgl-support';
import { buildCharacterSelectScene } from './character-select-scene';

@Component({
  selector: 'app-character-list',
  imports: [RouterLink],
  templateUrl: './character-list.html',
  styleUrl: './character-list.scss',
})
export class CharacterList implements OnInit, AfterViewInit, OnDestroy {
  private readonly characters = inject(CharacterApiService);
  private readonly auth = inject(AuthStateService);
  private readonly router = inject(Router);

  @ViewChild('sceneCanvas') private readonly canvasRef?: ElementRef<HTMLCanvasElement>;

  readonly items = signal<CharacterDto[]>([]);
  readonly loading = signal(true);
  /** Only true when WebGL is actually available — gates the <canvas> in the template. */
  readonly renderScene = isWebglAvailable();

  private renderer: RendererLifecycle | null = null;

  ngOnInit(): void {
    this.characters.list().subscribe({
      next: (list) => {
        this.items.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  ngAfterViewInit(): void {
    if (!this.renderScene || !this.canvasRef) {
      return;
    }
    const motionMode = detectMotionMode();
    this.renderer = new RendererLifecycle(
      this.canvasRef.nativeElement,
      motionMode,
      buildCharacterSelectScene(motionMode),
    );
    this.renderer.start();
  }

  ngOnDestroy(): void {
    this.renderer?.dispose();
    this.renderer = null;
  }

  logout(): void {
    this.auth.logout().subscribe(() => this.router.navigateByUrl('/login'));
  }
}
