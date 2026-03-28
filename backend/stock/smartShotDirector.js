function directShots(rawShots = []) {
  return rawShots.map((shot) => {
    if (shot.shotType === "coffee_shop_wide") {
      return {
        ...shot,
        directedShotType: "coffee_shop_wide",
        camera: "medium_wide",
        framing: "single character at table",
        directorReason: "establish Alex and the coffee shop setting"
      };
    }

    if (shot.shotType === "alex_reaction_closeup") {
      return {
        ...shot,
        directedShotType: "alex_reaction_closeup",
        camera: "closeup",
        framing: "face and shoulders",
        directorReason: "show Alex noticing something unusual"
      };
    }

    if (shot.shotType === "suspicious_detail_closeup") {
      return {
        ...shot,
        directedShotType: "suspicious_detail_closeup",
        camera: "detail_closeup",
        framing: "object or suspicious detail",
        directorReason: "show the clue that creates tension"
      };
    }

    if (shot.shotType === "wide_two_shot") {
      return {
        ...shot,
        directedShotType: "wide_two_shot",
        camera: "medium_wide",
        framing: "two people visible",
        directorReason: "establish both characters safely"
      };
    }

    if (shot.shotType === "speaker_closeup") {
      return {
        ...shot,
        directedShotType: "speaker_closeup",
        camera: "closeup",
        framing: "speaker face",
        directorReason: "focus on first speaker"
      };
    }

    if (shot.shotType === "listener_closeup") {
      return {
        ...shot,
        directedShotType: "listener_closeup",
        camera: "closeup",
        framing: "listener face",
        directorReason: "focus on second character reaction"
      };
    }

    if (shot.shotType === "outside_transition") {
      return {
        ...shot,
        directedShotType: "outside_transition",
        camera: "wide",
        framing: "full body transition",
        directorReason: "show movement toward outside location"
      };
    }

    if (shot.shotType === "car_dashboard_wide") {
      return {
        ...shot,
        directedShotType: "car_dashboard_wide",
        camera: "dashboard_wide",
        framing: "inside car wide shot",
        directorReason: "establish car scene"
      };
    }

    if (shot.shotType === "driver_closeup") {
      return {
        ...shot,
        directedShotType: "driver_closeup",
        camera: "closeup",
        framing: "driver face and steering wheel",
        directorReason: "show driver emotion"
      };
    }

    if (shot.shotType === "generic_wide") {
      return {
        ...shot,
        directedShotType: "generic_wide",
        camera: "wide",
        framing: "main subject visible",
        directorReason: "general establishment shot"
      };
    }

    if (shot.shotType === "generic_closeup") {
      return {
        ...shot,
        directedShotType: "generic_closeup",
        camera: "closeup",
        framing: "main subject reaction",
        directorReason: "general reaction shot"
      };
    }

    if (shot.shotType === "generic_detail") {
      return {
        ...shot,
        directedShotType: "generic_detail",
        camera: "detail",
        framing: "important visual detail",
        directorReason: "general detail shot"
      };
    }

    return {
      ...shot,
      directedShotType: shot.shotType,
      camera: "wide",
      framing: "default",
      directorReason: "default direction"
    };
  });
}

module.exports = {
  directShots
};
