/* ==========================================================================
   auth.js — Login simples para a secretaria
   Nota: autenticação do lado do cliente — protege contra acesso casual,
   não substitui um backend seguro. Os dados ficam no navegador.
   ========================================================================== */
(function (window) {
  "use strict";
  var U = window.U, D = window.MidasData;
  var SESSION_KEY = "midas2026_session";

  var Auth = {
    isLoggedIn: function () {
      var a = D.auth();
      if (!a.enabled) return true; // login desativado => acesso livre
      try { return window.sessionStorage.getItem(SESSION_KEY) === a.user; }
      catch (e) { return false; }
    },

    login: function (user, pass) {
      if (D.verificarLogin(user, pass)) {
        try { window.sessionStorage.setItem(SESSION_KEY, user); } catch (e) {}
        return true;
      }
      return false;
    },

    logout: function () {
      try { window.sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
    },

    // Mostra o ecrã de login e resolve quando autenticado
    showLogin: function (onSuccess) {
      var s = D.db().settings;
      var a = D.auth();
      var screen = document.getElementById("loginScreen");
      var app = document.getElementById("app");
      app.hidden = true;
      screen.hidden = false;
      screen.innerHTML =
        '<div class="login-card">' +
          '<img src="' + U.logoURL(false) + '" alt="Grupo Midas Angola" class="login-logo" />' +
          "<h1>" + U.esc(s.instituicao) + "</h1>" +
          '<div class="login-sys">' + U.esc(s.sistema) + "</div>" +
          '<span class="slogan">' + U.esc(s.slogan) + "</span>" +
          '<form id="loginForm" class="login-form">' +
            '<div class="field"><label>Utilizador</label>' +
              '<input id="loginUser" autocomplete="username" value="' + U.esc(a.user) + '" required></div>' +
            '<div class="field"><label>Palavra-passe</label>' +
              '<input id="loginPass" type="password" autocomplete="current-password" required autofocus></div>' +
            '<div class="login-err" id="loginErr" hidden>Utilizador ou palavra-passe incorretos.</div>' +
            '<button type="submit" class="btn btn-gold login-btn">Entrar</button>' +
          "</form>" +
          (a.precisaTrocar ? '<p class="login-hint">Primeiro acesso: <strong>' + U.esc(a.user) +
            "</strong> / <strong>midas2026</strong> — altere a palavra-passe em Configurações → Conta.</p>" : "") +
        "</div>" +
        '<div class="login-foot">© 2026 ' + U.esc(s.instituicao) + " · " + U.esc(s.slogan) + "</div>";

      var form = document.getElementById("loginForm");
      form.addEventListener("submit", function (ev) {
        ev.preventDefault();
        var u = document.getElementById("loginUser").value.trim();
        var p = document.getElementById("loginPass").value;
        if (Auth.login(u, p)) {
          screen.hidden = true; screen.innerHTML = "";
          app.hidden = false;
          if (typeof onSuccess === "function") onSuccess();
        } else {
          var err = document.getElementById("loginErr");
          err.hidden = false;
          document.getElementById("loginPass").value = "";
          document.getElementById("loginPass").focus();
        }
      });
    },

    // Gate: se autenticado chama onReady; caso contrário mostra login primeiro
    gate: function (onReady) {
      var app = document.getElementById("app");
      if (this.isLoggedIn()) {
        document.getElementById("loginScreen").hidden = true;
        app.hidden = false;
        onReady();
      } else {
        this.showLogin(onReady);
      }
    }
  };

  window.Auth = Auth;
})(window);
