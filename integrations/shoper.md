# Shoper

Masowe generowanie zdjęć produktów i opisów AI dla sklepów Shoper. Aplikacja działa obok sklepu i komunikuje się z Shoper REST API oraz z FOTOhub Commerce Bridge.

::: info Co daje
- **Masowe zdjęcia produktów** — wybierz produkty, wybierz preset, uruchom zadanie
- **Opisy AI** w 6 tonach i 3 językach (polski, angielski, niemiecki)
- **Wersje robocze** — nic nie nadpisuje danych produktu, dopóki nie zatwierdzisz
- **Preset zgodny z Allegro** — kwadratowe zdjęcia na białym tle, bez ramek i tekstu
- **Panel po polsku** z przełącznikiem na angielski
- **Kolejka zadań** z ponawianiem pojedynczych pozycji
:::

## Wymagania

| | |
|---|---|
| Sklep | Shoper z dostępem do webapi REST |
| Node.js | 20 lub nowszy |
| FOTOhub | Klucz API z [fotohub.app/console](https://fotohub.app/console) |

## Dostęp do Shoper webapi

Aplikacja potrzebuje konta z uprawnieniami do produktów i zdjęć produktów. W panelu Shoper przejdź do konfiguracji administratorów i utwórz konto obsługi z dostępem do webapi, albo użyj istniejącego konta administratora.

Uwierzytelnienie działa na dwa sposoby — wystarczy jeden:

- **Login i hasło** (`SHOPER_LOGIN`, `SHOPER_PASSWORD`) — aplikacja sama pobiera token i odnawia go po wygaśnięciu
- **Gotowy token** (`SHOPER_ACCESS_TOKEN`) — jeśli zarządzasz tokenem po swojej stronie

## Instalacja

```bash
git clone https://github.com/fotohubapp/shoper-app.git
cd shoper-app
npm install
cp .env.example .env
# uzupełnij .env
npm run build
npm start
```

Panel otwiera się pod adresem z `PUBLIC_URL` (domyślnie `http://localhost:3000`).

### Docker

```bash
docker build -t fotohub-shoper .
docker run -d --env-file .env -p 3000:3000 \
  -v fotohub-data:/app/data fotohub-shoper
```

Wolumen jest istotny: w `DATA_DIR` trzymane są wersje robocze i stan zadań, więc bez niego restart kontenera je usunie.

## Zmienne środowiskowe

| Zmienna | Wymagana | Opis |
|---------|----------|------|
| `SHOPER_STORE_URL` | tak | Adres sklepu, np. `https://sklep.example.pl` |
| `SHOPER_LOGIN` | tak\* | Login do webapi |
| `SHOPER_PASSWORD` | tak\* | Hasło do webapi |
| `SHOPER_ACCESS_TOKEN` | tak\* | Alternatywa dla loginu i hasła |
| `FOTOHUB_API_KEY` | tak | Klucz `fh_live_...` |
| `FOTOHUB_CONFIG_SECRET` | tak | Klucz do szyfrowania danych logowania na dysku |
| `DATA_DIR` | nie | Katalog na dane lokalne, domyślnie `./data` |
| `PUBLIC_URL` | nie | Publiczny adres aplikacji, używany w adresie webhooka |
| `HOST` / `PORT` | nie | Adres nasłuchu, domyślnie `127.0.0.1:3000` |

\* Podaj albo `SHOPER_LOGIN` z `SHOPER_PASSWORD`, albo `SHOPER_ACCESS_TOKEN`.

::: warning FOTOHUB_CONFIG_SECRET
Dane logowania do sklepu i klucz API są szyfrowane tym sekretem. Jeśli go zgubisz lub zmienisz, trzeba połączyć sklep od nowa. Ustaw go raz i trzymaj razem z innymi sekretami wdrożenia.
:::

## Połączenie sklepu

1. Otwórz panel aplikacji
2. Wpisz klucz FOTOhub — **Sprawdź klucz** pokaże aktualny stan kredytów
3. Uzupełnij adres sklepu i dane webapi
4. **Połącz** — aplikacja rejestruje połączenie w Commerce Bridge i zapisuje sekret webhooka

Przycisk **Sprawdź połączenie** w Ustawieniach weryfikuje jednocześnie Shoper i FOTOhub.

## Ekrany panelu

| Ekran | Do czego służy |
|-------|----------------|
| Panel | Kredyty, aktywne zadania, wersje robocze do zatwierdzenia, produkty bez opisu |
| Zdjęcia produktów | Kreator zadania masowego dla zdjęć |
| Opisy | Kreator dla treści: tytuł, opis, meta, alt |
| Zadania | Postęp zadań z podglądem pojedynczych pozycji |
| Wersje robocze | Kolejka do zatwierdzenia z porównaniem przed i po |
| Presety | Biblioteka presetów z polskimi nazwami |
| Ustawienia | Klucz API, dane sklepu, wartości domyślne, stan połączenia |
| MCP | Konfiguracja dla Claude Desktop i Cursor |

## Wybór produktów

Tabela produktów pobiera dane z Shoper i pozwala filtrować:

- **Szukaj** po nazwie lub SKU
- **Kategoria**
- **Tylko bez opisu** — produkty z pustym opisem
- **Mało zdjęć** — produkty z liczbą zdjęć poniżej progu
- **Zaznacz wszystkie pasujące** — obejmuje całą przefiltrowaną listę, nie tylko widoczną stronę

## Kosztorys przed uruchomieniem

Zanim zadanie wystartuje, panel pokazuje wyliczenie: *„N produktów × M zdjęć = X kredytów, masz Y"*. Przy niewystarczających środkach przycisk jest zablokowany z linkiem do doładowania. Dzięki temu zadanie nie umiera w połowie katalogu.

## Wersje robocze

Wyniki trafiają do lokalnej bazy wersji roboczych, nie do sklepu.

- **Zdjęcia** — suwak przed i po, przeciągany myszą lub strzałkami
- **Opisy** — porównanie starego i nowego tekstu z podświetleniem różnic
- **Zatwierdź** — zapis do Shoper: zdjęcie trafia do galerii produktu (opcjonalnie jako główne), tekst do pól tłumaczeń dla właściwego języka
- **Odrzuć** — usuwa wersję roboczą

Zatwierdzanie jest transakcyjne: zapis do Shoper następuje przed oznaczeniem wersji jako zatwierdzonej, więc awaria sieci nie zostawi wersji oznaczonej jako wdrożona bez faktycznego zapisu.

Skróty klawiszowe: **A** zatwierdź, **R** odrzuć, **J** i **K** nawigacja.

## Preset Allegro

W bibliotece jest preset `allegro-pl` przygotowany pod wymagania Allegro: format 1:1, minimum 1000 px, czyste białe tło, bez ramek, kolaży i tekstu na zdjęciu. Dla sklepów sprzedających równolegle na Allegro to najszybsza droga do zgodnych zdjęć.

Pełna biblioteka: 8 pakietów branżowych, 14 rodzajów tła, 12 scenerii, 8 rodzajów światła, 9 kompozycji, 6 profili kanałów i 6 tonów wypowiedzi — wszystkie z polskimi nazwami. Szczegóły w [dokumentacji Commerce Bridge](/integrations/commerce-bridge#preset-library).

## Ponawianie i limity

Zadania obsługują ponowienie **tylko nieudanych pozycji**, więc nie płacisz dwa razy za produkty, które już się udały.

Wysyłka zapytań jest rozłożona w czasie, aby nie wyczerpać limitu Shoper API — jedno duże zadanie nie zablokuje panelu sklepu ani nie doprowadzi do ograniczenia dostępu. Klient Shoper dodatkowo odnawia token po odpowiedzi `401` i stosuje wykładnicze wycofanie przy `429`.

## API aplikacji

Panel korzysta z tych endpointów. Przydają się, jeśli chcesz zautomatyzować pracę bez interfejsu.

| Endpoint | Opis |
|----------|------|
| `GET /api/status` | Stan aplikacji i token CSRF |
| `GET /api/settings` | Konfiguracja bez sekretów |
| `POST /api/validate-key` | Sprawdzenie klucza FOTOhub i stanu kredytów |
| `POST /api/connect` | Połączenie sklepu |
| `POST /api/disconnect` | Rozłączenie |
| `GET /api/health` | Kontrola Shoper i FOTOhub |
| `GET /api/summary` | Dane na Panel |
| `GET /api/products` | Lista produktów z filtrami i paginacją |
| `GET /api/categories` | Drzewo kategorii |
| `GET /api/presets` | Biblioteka presetów |
| `POST /api/estimate` | Kosztorys |
| `GET`, `POST /api/jobs` | Lista i tworzenie zadań |
| `GET /api/drafts` | Wersje robocze, zatwierdzanie i odrzucanie |
| `GET /api/balance` | Stan kredytów |
| `POST /api/language` | Przełączenie języka panelu |

Zapytania modyfikujące wymagają nagłówka `X-CSRF-Token` z tokenem pobranym z `/api/status`.

## Bezpieczeństwo

- Klucz API i dane logowania są szyfrowane na dysku i **nigdy** nie pojawiają się w logach ani w odpowiedziach API
- Webhooki z Commerce Bridge są weryfikowane podpisem HMAC-SHA256 z ochroną przed powtórzeniem
- Tokeny CSRF na wszystkich zapytaniach modyfikujących
- Ograniczenie liczby zapytań na trasach zapisujących
- Nazwy produktów są escapowane przed wstawieniem do panelu — nazwa produktu to dane kontrolowane z zewnątrz

::: danger Nie wystawiaj panelu publicznie bez ochrony
Aplikacja ma dostęp do Twojego sklepu i kredytów FOTOhub. Domyślnie nasłuchuje na `127.0.0.1`. Jeśli wystawiasz ją publicznie, postaw przed nią HTTPS i uwierzytelnienie.
:::

## Zarządzanie z asystenta AI

Zakładka MCP zawiera gotową konfigurację:

```json
{
  "mcpServers": {
    "fotohub": {
      "url": "https://apis.fotohub.app/mcp/",
      "headers": { "Authorization": "Bearer fh_live_twoj_klucz" }
    }
  }
}
```

Po dodaniu jej do Claude Desktop lub Cursor możesz generować zdjęcia i opisy rozmawiając z asystentem. Pełna lista narzędzi: [integracja MCP](/integrations/mcp).

## Rozwiązywanie problemów

| Objaw | Co sprawdzić |
|-------|--------------|
| „Nieprawidłowy klucz API" | Klucz musi zaczynać się od `fh_live_` i być aktywny w konsoli |
| Błąd uwierzytelnienia Shoper | Konto musi mieć dostęp do webapi; sprawdź `SHOPER_STORE_URL` bez końcowego ukośnika |
| Brak produktów na liście | Konto webapi nie ma uprawnień do produktów, albo filtry są zbyt wąskie |
| Zadanie stoi w kolejce | Sprawdź `/api/health`; przy dużych zadaniach wysyłka jest rozłożona w czasie celowo |
| Wersje robocze nie znikają po zatwierdzeniu | Zapis do Shoper się nie udał — komunikat błędu jest przy pozycji |
| `402` brak kredytów | Doładuj konto, potem użyj **Ponów nieudane** |
| Zdjęcie zatwierdzone, ale nie widać go w sklepie | Shoper cache'uje miniatury; odśwież je w panelu sklepu |
| Utrata danych po restarcie | Brakuje wolumenu na `DATA_DIR` |

## Powiązane

- [Commerce Bridge API](/integrations/commerce-bridge) — kontrakt zadań, presetów i webhooków
- [Katalog modeli](/api/models) — modele i cennik
- [Przegląd integracji](/integrations/overview) — wszystkie platformy
