var app;

tm.main(function() {
    console.log("main start");

    app = tm.display.CanvasApp("#app");
    app.resize(320, 320).fitWindow();
    app.replaceScene(tm.app.LoadingScene({
        width: 320,
        height: 320,
        assets: {
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
    }

});