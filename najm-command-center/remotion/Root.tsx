import { Composition } from "remotion";
import { TaamunReel } from "./TaamunReel";

const FPS = 30;
const DURATION_SECONDS = 36;

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="TaamunReel"
      component={TaamunReel}
      durationInFrames={FPS * DURATION_SECONDS}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
