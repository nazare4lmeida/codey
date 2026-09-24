import forestImg from "@/assets/world-forest.jpg";
import cavernImg from "@/assets/world-cavern.jpg";
import skyImg from "@/assets/world-sky.jpg";
import oceanImg from "@/assets/world-ocean.jpg";
import apisImg from "@/assets/world-apis.jpg";
import reactImg from "@/assets/world-react.jpg";
import testsImg from "@/assets/world-tests.jpg";
import databaseImg from "@/assets/world-database.jpg";
import nodeImg from "@/assets/world-node.jpg";
import expressImg from "@/assets/world-express.jpg";
import integrationImg from "@/assets/world-integration.jpg";
import summitImg from "@/assets/world-summit.jpg";

// Uma imagem única por ilha (12 ilhas, 12 imagens)
export const islandImages: Record<number, string> = {
  1: forestImg,
  2: cavernImg,
  3: skyImg,
  4: oceanImg,
  5: apisImg,
  6: reactImg,
  7: testsImg,
  8: databaseImg,
  9: nodeImg,
  10: expressImg,
  11: integrationImg,
  12: summitImg,
};

export const getIslandImage = (id: number) => islandImages[id] ?? forestImg;
