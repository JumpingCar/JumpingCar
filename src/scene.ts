import * as p5 from 'p5';

export class Scene {
  public preload() : void {
    return;
  }
  public setup() : void{
      return;
  }

  public draw(p: p5): void {
    p.colorMode(p.HSB);
    p.stroke(0, 0, 0);
    p.fill(180, 225, 225);
    p.circle(0, 0, 50);
  }
}
