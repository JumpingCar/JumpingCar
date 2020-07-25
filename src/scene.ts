import * as p5 from 'p5';

export class Scene {
  public preload(p: p5){
  }
  public setup(p: p5){
  }

  public draw(p: p5): void {
    p.colorMode(p.HSB);
    p.stroke(0, 0, 0);
    p.fill(180, 225, 225);
    p.circle(0, 0, 50);
  }
}