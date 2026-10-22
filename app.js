(function () {
  "use strict";

  const properties = window.LUXE_PROPERTIES || [];
  const savedKey = "luxe-estates-favourites";
  const imageUrl = (image, width) => `https://images.unsplash.com/${image}?auto=format&fit=crop&w=${width}&q=85`;
  const formatPrice = price => new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(price);
  const readSaved = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(savedKey) || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch (error) {
      console.error("Unable to read saved residences.", error);
      return [];
    }
  };

  function renderShell() {
    const header = document.querySelector("#site-header");
    const footer = document.querySelector("#site-footer");
    if (header) {
      header.innerHTML = `
        <header class="site-header">
          <div class="wrap nav-wrap">
            <a class="brand" href="index.html" aria-label="LUXE ESTATES home"><span class="brand-mark">L</span><span class="brand-name">LUXE <span>ESTATES</span></span></a>
            <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="primary-navigation"><span></span><span></span><span class="visually-hidden">Toggle navigation</span></button>
            <nav class="primary-nav" id="primary-navigation" aria-label="Main navigation">
              <a href="index.html">Home</a><a href="properties.html">Properties</a><a href="properties.html">Buy</a><a href="index.html#contact">Sell</a><a href="index.html#about">About us</a><a href="index.html#contact">Contact</a>
              <a class="nav-cta" href="properties.html">Explore properties <span aria-hidden="true">↗</span></a>
            </nav>
          </div>
        </header>`;
    }
    if (footer) {
      footer.innerHTML = `
        <footer class="site-footer">
          <div class="wrap footer-main">
            <div class="footer-brand"><a class="brand" href="index.html"><span class="brand-mark">L</span><span class="brand-name">LUXE <span>ESTATES</span></span></a><p>A considered collection of exceptional South African homes.</p><a href="mailto:hello@luxeestates.example">hello@luxeestates.example</a><small>Editable demonstration contact · replace before launch</small></div>
            <div class="footer-links"><h2>Explore</h2><a href="properties.html">All properties</a><a href="properties.html?type=Mansion">Mansions</a><a href="properties.html?type=Villa">Villas</a><a href="properties.html?type=Penthouse">Penthouses</a></div>
            <div class="footer-links"><h2>Discover</h2><a href="index.html#about">About us</a><a href="index.html#contact">Buying with us</a><a href="index.html#contact">Selling with us</a><a href="index.html#contact">Contact</a></div>
            <div class="footer-newsletter"><h2>A note from LUXE</h2><p>Occasional homes and considered living, delivered thoughtfully.</p><form data-newsletter-form><label class="visually-hidden" for="newsletter-email">Email address</label><div class="newsletter-field"><input id="newsletter-email" name="email" type="email" placeholder="Your email address" required><button type="submit" aria-label="Join newsletter">↗</button></div><p class="form-feedback" aria-live="polite">Demo only. Your details will not be sent or stored.</p></form></div>
          </div>
          <div class="wrap footer-bottom"><span>© ${new Date().getFullYear()} LUXE ESTATES · Demonstration website</span><div><a href="legal.html#privacy-policy">Privacy policy</a><a href="legal.html#terms">Terms</a><a href="https://www.instagram.com/" target="_blank" rel="noreferrer">Instagram ↗</a></div></div>
        </footer>`;
    }
  }

  function propertyCard(property) {
    const saved = readSaved().includes(property.id);
    return `<article class="property-card" data-property-card>
      <a class="property-card-image" href="property.html?id=${encodeURIComponent(property.id)}" aria-label="View ${property.name}">
        <img src="${imageUrl(property.image, 900)}" alt="${property.name} — exterior and architecture" loading="lazy">
        <span class="property-type">${property.type}</span>
      </a>
      <button class="favorite-button${saved ? " is-saved" : ""}" type="button" data-favorite="${property.id}" aria-pressed="${saved}" aria-label="${saved ? "Remove" : "Save"} ${property.name} ${saved ? "from" : "to"} favourites"><span aria-hidden="true">${saved ? "♥" : "♡"}</span></button>
      <div class="property-card-body">
        <p class="property-location">${property.location}</p>
        <h3><a href="property.html?id=${encodeURIComponent(property.id)}">${property.name}</a></h3>
        <p class="property-price">${formatPrice(property.price)}</p>
        <div class="property-meta"><span>${property.bedrooms} bed</span><span>${property.bathrooms} bath</span><span>${property.area.toLocaleString("en-ZA")} m²</span></div>
        <p class="property-short">${property.shortDescription}</p>
        <a class="card-link" href="property.html?id=${encodeURIComponent(property.id)}">View property <span aria-hidden="true">↗</span></a>
      </div>
    </article>`;
  }

  function setupSelects() {
    const locations = [...new Set(properties.map(property => property.region))].sort();
    const types = [...new Set(properties.flatMap(property => [property.type, property.category]))].sort();
    document.querySelectorAll('select[name="location"]').forEach(select => {
      const first = select.options[0];
      select.innerHTML = "";
      select.append(first);
      locations.forEach(location => select.add(new Option(location, location)));
    });
    document.querySelectorAll('select[name="type"]').forEach(select => {
      const first = select.options[0];
      select.innerHTML = "";
      select.append(first);
      types.forEach(type => select.add(new Option(type, type)));
    });
  }

  function getFilters(form) {
    const values = new FormData(form);
    const price = String(values.get("price") || "").split("-");
    return {
      location: values.get("location") || "",
      type: values.get("type") || "",
      minPrice: price[0] ? Number(price[0]) : 0,
      maxPrice: price[1] ? Number(price[1]) : Infinity,
      bedrooms: Number(values.get("bedrooms") || 0),
      sort: values.get("sort") || "featured"
    };
  }

  function matchingProperties(filters) {
    const matches = properties.filter(property =>
      (!filters.location || property.region === filters.location) &&
      (!filters.type || property.type === filters.type || property.category === filters.type) &&
      property.price >= filters.minPrice && property.price <= filters.maxPrice &&
      property.bedrooms >= filters.bedrooms
    );
    if (filters.sort === "price-asc") matches.sort((a, b) => a.price - b.price);
    if (filters.sort === "price-desc") matches.sort((a, b) => b.price - a.price);
    if (filters.sort === "area-desc") matches.sort((a, b) => b.area - a.area);
    return matches;
  }

  function applyQueryFilters(form) {
    const params = new URLSearchParams(window.location.search);
    ["location", "type", "price", "bedrooms"].forEach(key => {
      const value = params.get(key);
      if (value && form.elements.namedItem(key)) form.elements.namedItem(key).value = value;
    });
  }

  function renderListings() {
    const form = document.querySelector("[data-listing-form]");
    const container = document.querySelector("#listing-properties");
    if (!form || !container) return;
    const count = document.querySelector("#listing-count");
    const empty = document.querySelector("#empty-state");
    const render = () => {
      const results = matchingProperties(getFilters(form));
      container.innerHTML = results.map(propertyCard).join("");
      count.textContent = `${results.length} ${results.length === 1 ? "residence" : "residences"} in the collection`;
      empty.hidden = results.length > 0;
    };
    applyQueryFilters(form);
    render();
    form.addEventListener("change", render);
    form.addEventListener("submit", event => { event.preventDefault(); render(); });
    form.addEventListener("reset", () => window.setTimeout(render, 0));
    document.querySelector("[data-clear-empty]")?.addEventListener("click", () => { form.reset(); });
    document.querySelectorAll("[data-view]").forEach(button => button.addEventListener("click", () => {
      const list = button.dataset.view === "list";
      container.classList.toggle("is-list-view", list);
      document.querySelectorAll("[data-view]").forEach(option => option.setAttribute("aria-pressed", String(option === button)));
    }));
  }

  function renderFeatured() {
    const container = document.querySelector("#featured-properties");
    if (container) container.innerHTML = properties.slice(0, 3).map(propertyCard).join("");
  }

  function renderDetail() {
    const container = document.querySelector("#property-detail");
    if (!container) return;
    const property = properties.find(item => item.id === new URLSearchParams(window.location.search).get("id"));
    if (!property) {
      container.innerHTML = `<section class="not-found wrap"><p class="eyebrow">A different direction</p><h1>This residence is<br><em>not in this collection.</em></h1><p>Explore the collection to discover another place that feels like yours.</p><a class="button button-gold" href="properties.html">Explore properties <span aria-hidden="true">↗</span></a></section>`;
      return;
    }
    const similar = properties.filter(item => item.id !== property.id && (item.category === property.category || item.region === property.region)).slice(0, 3);
    document.title = `${property.name} | LUXE ESTATES`;
    document.querySelector('meta[name="description"]')?.setAttribute("content", `${property.shortDescription} ${property.location}.`);
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", `${property.name} | LUXE ESTATES`);
    container.innerHTML = `
      <section class="detail-hero wrap"><div class="detail-hero-image"><img src="${imageUrl(property.image, 1800)}" alt="${property.name} architectural exterior"></div><div class="detail-hero-caption"><span>${property.type} · ${property.location}</span><button class="favorite-button detail-favorite${readSaved().includes(property.id) ? " is-saved" : ""}" type="button" data-favorite="${property.id}" aria-pressed="${readSaved().includes(property.id)}" aria-label="Save ${property.name} to favourites"><span aria-hidden="true">${readSaved().includes(property.id) ? "♥" : "♡"}</span> Save residence</button></div></section>
      <section class="detail-main wrap"><div class="detail-heading"><div><p class="eyebrow">${property.location} · Demonstration listing</p><h1>${property.name}</h1></div><p class="detail-price">${formatPrice(property.price)}</p></div>
        <div class="detail-stats"><span>${property.bedrooms} <small>Bedrooms</small></span><span>${property.bathrooms} <small>Bathrooms</small></span><span>${property.garages} <small>Garages</small></span><span>${property.area.toLocaleString("en-ZA")} m² <small>Floor area</small></span></div>
        <div class="detail-columns"><article class="detail-description"><p class="eyebrow">The residence</p><h2>A home with its own<br><em>point of view.</em></h2><p>${property.description}</p><p>All details on this page are illustrative sample content and do not describe a verified property or active listing.</p>
          <div class="gallery-grid">${property.images.map((image, index) => `<button class="gallery-image" type="button" data-gallery-image="${index}" aria-label="View image ${index + 1} of ${property.name}"><img src="${imageUrl(image, 800)}" alt="${property.name} — gallery view ${index + 1}" loading="lazy"></button>`).join("")}</div>
          <p class="eyebrow feature-eyebrow">Considered details</p><ul class="feature-list">${property.features.map(feature => `<li>${feature}</li>`).join("")}</ul>
        </article>
        <aside class="agent-card"><p class="eyebrow">A personal introduction</p><h2>Make this your<br><em>next chapter.</em></h2><p>Share a few details and our team will be in touch. This demonstration form is not connected to an inbox.</p><form data-demo-form><label>Full name<input name="name" autocomplete="name" required></label><label>Email address<input name="email" type="email" autocomplete="email" required></label><label>Phone number<input name="phone" type="tel" autocomplete="tel"></label><label>Message<textarea name="message" rows="3" required>I'm interested in ${property.name}.</textarea></label><button class="button button-gold" type="submit">Register interest <span aria-hidden="true">↗</span></button><p class="form-feedback" aria-live="polite">Demo only. Your details will not be sent or stored.</p></form></aside></div>
      </section>
      ${similar.length ? `<section class="section similar-section"><div class="wrap"><div class="section-heading"><div><p class="eyebrow">Continue exploring</p><h2>In a similar<br><em>spirit.</em></h2></div><a class="text-link" href="properties.html">View the collection <span aria-hidden="true">↗</span></a></div><div class="property-grid">${similar.map(propertyCard).join("")}</div></div></section>` : ""}`;
    setupGallery();
  }

  function setupGallery() {
    const buttons = [...document.querySelectorAll("[data-gallery-image]")];
    if (!buttons.length) return;
    buttons.forEach(button => button.addEventListener("click", () => {
      const image = button.querySelector("img");
      const dialog = document.createElement("dialog");
      dialog.className = "gallery-dialog";
      dialog.innerHTML = `<button type="button" class="gallery-close" aria-label="Close image">×</button><img src="${image.src}" alt="${image.alt}">`;
      document.body.append(dialog);
      dialog.showModal();
      dialog.querySelector("button").addEventListener("click", () => dialog.close());
      dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
      dialog.addEventListener("close", () => dialog.remove(), { once: true });
    }));
  }

  function setupInteractions() {
    document.addEventListener("click", event => {
      const favorite = event.target.closest("[data-favorite]");
      if (favorite) {
        const id = favorite.dataset.favorite;
        const saved = readSaved();
        const isSaved = saved.includes(id);
        const updated = isSaved ? saved.filter(item => item !== id) : [...saved, id];
        try {
          localStorage.setItem(savedKey, JSON.stringify(updated));
          document.querySelectorAll(`[data-favorite="${CSS.escape(id)}"]`).forEach(button => {
            button.classList.toggle("is-saved", !isSaved);
            button.setAttribute("aria-pressed", String(!isSaved));
            button.setAttribute("aria-label", `${!isSaved ? "Remove" : "Save"} ${properties.find(item => item.id === id)?.name || "residence"} ${!isSaved ? "from" : "to"} favourites`);
            const icon = button.querySelector("span");
            if (icon) icon.textContent = isSaved ? "♡" : "♥";
          });
        } catch (error) {
          console.error("Unable to save this residence.", error);
        }
      }
    });

    document.querySelectorAll("[data-search-form]").forEach(form => form.addEventListener("submit", event => {
      event.preventDefault();
      const values = new FormData(form);
      const params = new URLSearchParams();
      ["location", "type", "price", "bedrooms"].forEach(key => { if (values.get(key)) params.set(key, values.get(key)); });
      window.location.href = `properties.html${params.size ? `?${params.toString()}` : ""}`;
    }));

    document.querySelectorAll("[data-demo-form], [data-newsletter-form]").forEach(form => form.addEventListener("submit", event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const feedback = form.querySelector(".form-feedback");
      if (feedback) feedback.textContent = form.matches("[data-newsletter-form]") ?
        "Thank you for your interest. This demo is not connected to a subscription service." :
        "Thank you for your interest. This demo is not connected to an inbox, so your message has not been sent.";
    }));

    const toggle = document.querySelector(".menu-toggle");
    const nav = document.querySelector(".primary-nav");
    if (toggle && nav) {
      toggle.addEventListener("click", () => {
        const expanded = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!expanded));
        nav.classList.toggle("is-open", !expanded);
      });
      nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
        toggle.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
      }));
    }

    const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    }), { threshold: 0.12 });
    document.querySelectorAll(".section, .signature-section, .categories-section, .approach-section, .values-section, .testimonial-section, .contact-section").forEach(section => {
      section.classList.add("reveal");
      revealObserver.observe(section);
    });
  }

  renderShell();
  setupSelects();
  renderFeatured();
  renderListings();
  renderDetail();
  setupInteractions();
})();
