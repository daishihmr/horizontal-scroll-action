var app;
var map;
var piyo;

var G = 0.4;

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

        // 空中にいるフラグ
        this.jumping = false;

        // ジャンプボタン押しっぱなしフラグ
        this.jumpPressed = false;
        // ジャンプボタン押しっぱなしフレームカウンタ
        this.jumpUpCount = 0;

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

        // ジャンプ
        if (kb.getKeyDown("z") && !this.jumping) {
            // 上に加速
            this.velocity.y = Math.clamp(this.velocity.y - 4, -8, 8);
            this.jumping = true;
            this.jumpPressed = true;
            this.jumpUpCount = 0;
        } else if (kb.getKey("z") && this.jumpPressed) {
            // ジャンプボタンを長く押すと高くジャンプできる
            this.jumpUpCount += 1;
            if (this.jumpUpCount < 7) {
                // 上に加速
                this.velocity.y = Math.clamp(this.velocity.y - 1, -8, 8);
            }
        } else if (kb.getKeyUp("z")) {
            this.jumpPressed = false;
        }

        // 重力
        this.velocity.y = Math.min(this.velocity.y + G, 8);

        // 位置に速度を足す
        this.position.add(this.velocity);

        // 地形との衝突判定
        this.hitTest();
    },

    hitTest: function() {
        // 床との衝突判定
        // 足の部分が地形に触れなくなるまでひよこを上に移動させる
        while (map.isHitPointTile(this.left + 10, this.bottom) || map.isHitPointTile(this.right - 10, this.bottom)) {
            this.y -= 0.1;
            this.velocity.y = 0;
            this.jumping = false;
        }
    }

});
