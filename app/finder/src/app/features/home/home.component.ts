import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BackgroundAnimationComponent } from '@ds/background-animation/background-animation.component';

@Component({
  selector: 'app-home',
  imports: [HlmButton, NgOptimizedImage, RouterLink, BackgroundAnimationComponent],
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {}
