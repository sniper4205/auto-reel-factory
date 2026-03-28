function hasAny(text, words = []) {
  return words.some((w) => text.includes(w));
}

function buildCinematicShots(scriptText = "") {
  const text = String(scriptText).toLowerCase();

  // True crime / coffee shop style
  if (hasAny(text, ["coffee shop", "cafe", "alex"])) {
    return [
      {
        shotId: 1,
        sceneGroup: "coffee_shop",
        shotType: "coffee_shop_wide",
        description: "wide shot of Alex sitting alone in a coffee shop"
      },
      {
        shotId: 2,
        sceneGroup: "coffee_shop",
        shotType: "alex_reaction_closeup",
        description: "close-up of Alex noticing something unusual"
      },
      {
        shotId: 3,
        sceneGroup: "coffee_shop",
        shotType: "suspicious_detail_closeup",
        description: "close-up of a suspicious detail in the coffee shop"
      }
    ];
  }

  // Driving / living room type story
  if (hasAny(text, ["drive", "driving", "car", "living room"])) {
    return [
      {
        shotId: 1,
        sceneGroup: "conversation",
        shotType: "wide_two_shot",
        description: "wide shot of both characters talking indoors"
      },
      {
        shotId: 2,
        sceneGroup: "conversation",
        shotType: "speaker_closeup",
        description: "close-up reaction shot of first character"
      },
      {
        shotId: 3,
        sceneGroup: "conversation",
        shotType: "listener_closeup",
        description: "close-up reaction shot of second character"
      },
      {
        shotId: 4,
        sceneGroup: "transition",
        shotType: "outside_transition",
        description: "characters moving toward car outside"
      },
      {
        shotId: 5,
        sceneGroup: "driving",
        shotType: "car_dashboard_wide",
        description: "wide dashboard shot inside car"
      },
      {
        shotId: 6,
        sceneGroup: "driving",
        shotType: "driver_closeup",
        description: "close-up of driver inside car"
      }
    ];
  }

  // Generic fallback
  return [
    {
      shotId: 1,
      sceneGroup: "general",
      shotType: "generic_wide",
      description: "wide cinematic shot matching the script"
    },
    {
      shotId: 2,
      sceneGroup: "general",
      shotType: "generic_closeup",
      description: "close-up cinematic reaction shot matching the script"
    },
    {
      shotId: 3,
      sceneGroup: "general",
      shotType: "generic_detail",
      description: "detail shot matching the script"
    }
  ];
}

module.exports = {
  buildCinematicShots
};
