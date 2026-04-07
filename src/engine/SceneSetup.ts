import * as pc from 'playcanvas';

export function createApp(canvas: HTMLCanvasElement): pc.Application {
  const app = new pc.Application(canvas, {
    mouse: new pc.Mouse(canvas),
    touch: new pc.TouchDevice(canvas),
  });

  app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
  app.setCanvasResolution(pc.RESOLUTION_AUTO);

  // Orthographic camera looking down
  const camera = new pc.Entity('camera');
  camera.addComponent('camera', {
    projection: pc.PROJECTION_ORTHOGRAPHIC,
    orthoHeight: 10,
    nearClip: 0.1,
    farClip: 100,
    clearColor: new pc.Color(0.0, 0.55, 0.55), // teal table
  });
  camera.setPosition(0, 20, 0);
  camera.setEulerAngles(-90, 0, 0);
  app.root.addChild(camera);

  // Handle resize
  window.addEventListener('resize', () => {
    app.resizeCanvas();
  });

  return app;
}

export function getCamera(app: pc.Application): pc.Entity {
  const cam = app.root.findByName('camera');
  if (!cam) throw new Error('Camera not found');
  return cam as pc.Entity;
}
