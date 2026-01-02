// Lightweight Console Protection
// Only blocks DevTools, doesn't affect normal users
(function() {
    'use strict';
    
    var detected = false;
    
    // Action on detection - soft redirect
    function onDetect() {
        if (detected) return;
        detected = true;
        
        // Clear page and redirect
        try {
            document.body.innerHTML = '';
            document.body.style.background = '#000';
        } catch(e) {}
        
        setTimeout(function() {
            window.location.href = 'about:blank';
        }, 100);
    }
    
    // Block DevTools hotkeys only
    document.addEventListener('keydown', function(e) {
        // F12
        if (e.key === 'F12' || e.keyCode === 123) {
            e.preventDefault();
            onDetect();
            return false;
        }
        
        // Ctrl+Shift+I/J/C (Windows/Linux)
        if (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) {
            e.preventDefault();
            onDetect();
            return false;
        }
        
        // Cmd+Option+I (Mac)
        if (e.metaKey && e.altKey && e.keyCode === 73) {
            e.preventDefault();
            onDetect();
            return false;
        }
        
        // Ctrl+U (view source)
        if ((e.ctrlKey || e.metaKey) && e.keyCode === 85) {
            e.preventDefault();
            return false;
        }
    }, true);
    
    // Detect DevTools via console timing (lightweight check)
    var checkConsole = function() {
        var start = performance.now();
        console.profile();
        console.profileEnd();
        if (performance.now() - start > 10) {
            onDetect();
        }
    };
    
    // Check only on suspicious events, not continuously
    window.addEventListener('resize', function() {
        // DevTools often triggers resize
        var widthDiff = window.outerWidth - window.innerWidth;
        var heightDiff = window.outerHeight - window.innerHeight;
        
        if (widthDiff > 160 || heightDiff > 160) {
            checkConsole();
        }
    });
    
    // Disable right-click context menu (optional, lightweight)
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    });
    
})();
