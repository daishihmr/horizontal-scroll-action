var app;
var scene;
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
            "piyoImage": "hiyoco_nomal_full.png",
            "mechaImage": "hiyoco_mecha_full.png"
        },
        nextScene: MainScene
    }));
    app.run();
});

tm.define("MainScene", {
    superClass: tm.app.Scene,

    init: function() {
        this.superInit();
        scene = this;
        console.log("start MainScene");

        var scrollArea = tm.app.Object2D();
        scrollArea.addChildTo(this);
        scrollArea.update = function() {
            // this.x = -piyo.x + app.width/2;
            // this.y = -piyo.y + app.height/2;
            var xx = piyo.scaleX * 60;
            this.x = Math.clamp(this.x + (-piyo.x + app.width/2 + xx - this.x) * 0.05, -map.width, 0);
            this.y = Math.clamp(this.y + (-piyo.y + app.height/2 - this.y) * 0.1, -320, map.height);

        };

        var mapSheet = tm.asset.AssetManager.get("mapSheet");
        map = tm.display.MapSprite(mapSheet, 32, 32);
        map.addChildTo(scrollArea);

        piyo = Piyo();
        piyo.setPosition(150, 150);
        piyo.addChildTo(scrollArea);

        var EnemyClasses = [null, WalkMecha, JumpMecha];
        for (var y = 0; y < mapSheet.height; y++) {
            for (var x = 0; x < mapSheet.width; x++) {
                var data = mapSheet.layers[1].data[y*mapSheet.width + x];
                if (data >= 1) {
                    EnemyEgg(EnemyClasses[data]).setPosition(x*32, y*32).addChildTo(scrollArea);
                }
            }
        }

    },

    gameover: function() {
        var label = tm.display.Label("GAME OVER", 40)
            .setFillStyle("red")
            .setAlpha(0)
            .setAlign("center")
            .setBaseline("middle")
            .setPosition(app.width/2, app.height/2)
            .addChildTo(this);
        label.tweener.clear()
            .to({
                alpha: 1
            }, 1000)
            .call(function() {
                app.stop();
            });
    }

});

tm.define("GObject", {
    superClass: "tm.display.Sprite",

    init: function(texture, width, height) {
        this.superInit(texture, width, height);
        this.setFrameIndex(0);

        // 左側の壁に衝突したフラグ
        this.hitLeft = false;
        // 右側の～
        this.hitRight = false;
        // 天井に頭をぶつけたフラグ
        this.hitHead = false;

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
        this.preUpdate(app);

        // 重力
        this.velocity.y = Math.min(this.velocity.y + G, 8);

        // 位置に速度を足す
        this.position.add(this.velocity);

        // 地形との衝突判定
        this.testHitTile();

        this.postUpdate(app);

        if (this.hitLeft) {
            this.dispatchEvent(tm.event.Event("hitleft"));
        }
        if (this.hitRight) {
            this.dispatchEvent(tm.event.Event("hitright"));
        }
        if (this.hitHead) {
            this.dispatchEvent(tm.event.Event("hithead"));
        }
        if (this.hitGround) {
            this.dispatchEvent(tm.event.Event("hitground"));
        }
    },

    preUpdate: function() {},
    postUpdate: function() {},

    testHitTile: function() {
        var j = this.jumping;

        // 壁との衝突判定
        // 左側に壁がある場合
        this.hitLeft = false;
        while (map.isHitPointTile(this.left, this.top + 10) || map.isHitPointTile(this.left, this.bottom - 10)) {
            this.x += 0.1;
            this.velocity.x = 0;
            this.hitLeft = true;
        }

        // 右側に壁がある場合
        this.hitRight = false;
        while (map.isHitPointTile(this.right, this.top + 10) || map.isHitPointTile(this.right, this.bottom - 10)) {
            this.x -= 0.1;
            this.velocity.x = 0;
            this.hitRight = true;
        }

        // 天井との衝突判定
        this.hitHead = false;
        while (map.isHitPointTile(this.left + 10, this.top) || map.isHitPointTile(this.right - 10, this.top)) {
            this.y += 0.1;
            this.velocity.y = 0;
            this.hitHead = true;
        }

        // 床との衝突判定
        // 足の部分が地形に触れなくなるまでひよこを上に移動させる
        this.jumping = true;
        while (map.isHitPointTile(this.left + 10, this.bottom) || map.isHitPointTile(this.right - 10, this.bottom)) {
            this.y -= 0.1;
            this.velocity.y = 0;
            this.jumping = false;
        }

        this.hitGround = j && !this.jumping;
    }

});

tm.define("EnemyEgg", {
    superClass: "tm.app.Object2D",

    init: function(enemyClass) {
        this.superInit();
        this.enemyClass = enemyClass;
    },

    update: function() {
        if (Math.abs(this.x - piyo.x) < 180) {
            this.enemyClass().setPosition(this.x, this.y).addChildTo(this.parent);
            this.remove();
        }
    }
});

tm.define("Piyo", {
    superClass: "GObject",

    init: function() {
        this.superInit("piyoImage", 32, 32);
        this.setScale(-1, 1);
        this.radius = 12;

        this.hp = 10;
        this.muteki = 60;
    },

    damage: function(enemy) {
        if (this.muteki > 0 || this.hp <= 0) return;

        if (enemy.x > this.x) {
            this.velocity.x = -8;
        } else {
            this.velocity.x = 8;
        }
        this.velocity.y = -2;

        this.hp -= 1;
        if (this.hp > 0) {
            this.muteki = 60;
        } else {
            scene.gameover();
        }
    },

    preUpdate: function(app) {
        if (this.hp > 0) {
            var kb = app.keyboard;

            if (kb.getKey("left")) {
                // 左に加速
                this.velocity.x = Math.clamp(this.velocity.x - 0.5, -4, 4);
                this.setScale(1, 1);
            } else if (kb.getKey("right")) {
                // 右に加速
                this.velocity.x = Math.clamp(this.velocity.x + 0.5, -4, 4);
                this.setScale(-1, 1);
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
        } else {
            // 減速
            this.velocity.x *= 0.8;
            if (-0.1 < this.velocity.x && this.velocity.x < 0.1) {
                this.velocity.x = 0;
            }
        }
    },

    postUpdate: function(app) {
        if (this.y > 1000 && this.hp > 0) {
            this.hp = 0;
            scene.gameover();
        }

        if (this.hp > 0) {
            // 絵柄変更
            if (this.jumping) {
                if (this.velocity.y > 0) {
                    this.setFrameIndex(4);
                } else {
                    this.setFrameIndex(3);
                }
            } else {
                if (this.velocity.x == 0) {
                    this.setFrameIndex(0);
                } else {
                    this.setFrameIndex(1 + Math.floor(app.frame/3) % 3);
                }
            }

            this.muteki -= 1;
            if (this.muteki > 0) {
                this.alpha = 0.8 * (app.frame % 2);
            } else {
                this.alpha = 1;
            }
        } else {
            if (this.jumping) {
                this.setFrameIndex(4);
            } else {
                this.setFrameIndex(5);
            }
        }
    },

});

tm.define("Enemy", {
    superClass: "GObject",

    init: function(texture, width, height) {
        this.superInit(texture, width, height);
        this.active = true;
    },

    damage: function() {},

    preUpdate: function(app) {
        this.act(app);
    },

    postUpdate: function() {
        if (this.active) this.testHitPiyo();
    },

    testHitPiyo: function() {
        if (this.isHitElement(piyo)) {
            if (piyo.y < this.y - this.radius/2) {
                piyo.velocity.y = -8;
                this.velocity.y = 8;
                this.damage();
            } else {
                piyo.damage(this);
            }
        }
    }
});

tm.define("WalkMecha", {
    superClass: "Enemy",

    init: function() {
        this.superInit("mechaImage", 32, 32);
        this.scaleX = 1;
        this.radius = 12;
    },

    damage: function() {
        this.active = false;
        this.tweener.clear()
            .wait(1000)
            .call(function() {
                this.remove();
            }.bind(this));
    },

    act: function(app) {
        if (this.active) {
            this.velocity.x = this.scaleX * -0.5;
        } else {
            this.velocity.x = 0;
            this.alpha = 0.8 * (app.frame % 2)
            if (this.jumping) {
                this.setFrameIndex(4);
            } else {
                this.setFrameIndex(5);
            }
        }
    },

    onhitleft: function() {
        if (this.active) this.scaleX = -1;
    },

    onhitright: function() {
        if (this.active) this.scaleX = 1;
    }

});

tm.define("JumpMecha", {
    superClass: "Enemy",

    init: function() {
        this.superInit("mechaImage", 32, 32);
        this.scaleX = 1;
        this.radius = 12;
    },

    damage: function() {
        this.active = false;
        this.tweener.clear()
            .wait(1000)
            .call(function() {
                this.remove();
            }.bind(this));
    },

    act: function(app) {
        if (this.active) {
            this.velocity.x = this.scaleX * -0.5;
            this.velocity.y -= 0.2; // ふわふわする
        } else {
            this.velocity.x = 0;
            this.alpha = 0.8 * (app.frame % 2)
            if (this.jumping) {
                this.setFrameIndex(4);
            } else {
                this.setFrameIndex(5);
            }
        }
    },

    onhitground: function() {
        if (this.active) this.velocity.y = -6;
    },

    onhitleft: function() {
        if (this.active) this.scaleX = -1;
    },

    onhitright: function() {
        if (this.active) this.scaleX = 1;
    }

});
