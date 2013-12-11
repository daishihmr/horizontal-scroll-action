var app;
var map;

tm.main(function() {
    console.log("main start");

    app = tm.display.CanvasApp("#app");
    app.resize(320, 320).fitWindow();
    app.replaceScene(tm.app.LoadingScene({
        width: 320,
        height: 320,
        assets: {
            "mapSheet": "map.tmx",
            "piyoImage": "hiyoco_nomal_full.png"
        },
        nextScene: MainScene
    }));
    app.run();
});

tm.define("MainScene", {
    superClass: tm.app.Scene,

    init: function() {
        this.superInit();
        console.log("start MainScene");

        var mapSheet = tm.asset.AssetManager.get("mapSheet");
        map = tm.display.MapSprite(mapSheet, 32, 32);
        map.addChildTo(this);

        var piyo = Piyo();
        piyo.setPosition(150, 150);
        piyo.addChildTo(this);
    }

});

tm.define("Piyo", {
    superClass: "tm.display.Sprite",

    init: function() {
        this.superInit("piyoImage", 32, 32);
        this.setFrameIndex(0);
        this.setScale(-1, 1);
    }
});
