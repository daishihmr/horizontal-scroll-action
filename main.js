var app;
var map;
var piyo;

tm.main(function() {
    console.log("main start");

    app = tm.display.CanvasApp("#app");
    app.fps = 60;
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

        piyo = Piyo();
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

        // 速度
        this.velocity = tm.geom.Vector2(0, 0);
    },

    update: function(app) {
        var kb = app.keyboard;

        if (kb.getKey("left")) {
            // 左に加速
            this.velocity.x = Math.clamp(this.velocity.x - 0.5, -4, 4);
        } else if (kb.getKey("right")) {
            // 右に加速
            this.velocity.x = Math.clamp(this.velocity.x + 0.5, -4, 4);
        } else {
            // 減速
            this.velocity.x *= 0.8;
            if (-0.1 < this.velocity.x && this.velocity.x < 0.1) {
                this.velocity.x = 0;
            }
        }

        // 位置に速度を足す
        this.position.add(this.velocity);
    }

});
