import SwiftUI

// ------------------------------------------------------------------
// The tour itself, the native version of the site's focus mode.
// "Why this walk" is the page before stop one when the walk is
// started from the beginning, then one stop per page with swipe or
// prev/next navigation, the floating Map pill, and the paper
// transport bar with the audio controls.
// ------------------------------------------------------------------

struct TourView: View {
    @EnvironmentObject private var content: ContentStore
    @EnvironmentObject private var progress: ProgressStore
    @EnvironmentObject private var location: LocationService
    @EnvironmentObject private var audio: AudioEngine
    @Environment(\.dismiss) private var dismiss

    @State private var index: Int
    /// "Why this walk" sits in front of stop one whenever the walk is
    /// opened at the beginning. Resuming mid-walk skips it, because
    /// nobody standing at stop nine wants the essay again.
    @State private var onIntro: Bool
    @State private var showMap = false
    /// Stops whose on-page title has scrolled out of view; the top
    /// bar pins the stop name only while that is true.
    @State private var scrolledPastTitle: Set<String> = []
    /// Seconds actually spent reading each stop, and which stops the
    /// walker has engaged with (scrolled into, or listened to). A
    /// stop counts as visited only when both are true, so neither
    /// swiping through nor leaving the phone on a bench credits it.
    @State private var dwell: Task<Void, Never>?
    @State private var dwellSeconds: [String: Double] = [:]
    @State private var engaged: Set<String> = []
    /// The detour notice is a once-per-session courtesy. It fires the
    /// first time a walker lands on an optional stop, because that is
    /// the moment they might set off for Woodlawn without having read
    /// the practical card on the home screen.
    @State private var showDetourNotice = false
    @State private var detourNoticeShown = false
    @Environment(\.scenePhase) private var scenePhase

    /// A red plate to land on inside the opening stop, set when the
    /// walker arrives from the tools-of-segregation index. It is
    /// consumed by the page that uses it so a later swipe back to
    /// that stop opens at the top like any other.
    @State private var openPlate: String?

    init(startAt: Int, openPlate: String? = nil) {
        _index = State(initialValue: startAt)
        // Arriving on a specific plate is a deliberate jump, so it
        // skips the essay even when the plate lives on stop one.
        _onIntro = State(initialValue: startAt == 0 && openPlate == nil)
        _openPlate = State(initialValue: openPlate)
    }

    private var stops: [WalkStop] { content.tour.stops }

    /// A content refresh can swap the stops array mid-session; the
    /// stored index must never subscript past the new count.
    private var safeIndex: Int {
        min(max(0, index), max(0, stops.count - 1))
    }

    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    /// Page changes slide unless the walker asked for reduced motion.
    private func move(to newIndex: Int) {
        withAnimation(reduceMotion ? nil : .default) {
            index = newIndex
        }
    }

    /// Leaving the intro lands on stop one and starts everything the
    /// tour normally starts when a page opens.
    private func leaveIntro() {
        Haptics.tap()
        withAnimation(RFMotion.gated(.rfAppear, reduceMotion)) {
            onIntro = false
        }
        index = 0
        progress.setLastIndex(0)
        startDwell(at: 0)
    }

    /// Stepping back onto the intro. The reading clock stops, because
    /// the essay is not a stop and must not credit one.
    private func enterIntro() {
        Haptics.tap()
        dwell?.cancel()
        withAnimation(RFMotion.gated(.rfAppear, reduceMotion)) {
            onIntro = true
        }
    }

    /// Counts foreground seconds on the open stop and marks it
    /// visited once the walker has both stayed a while and shown they
    /// were actually reading it. Time accumulates per stop rather
    /// than resetting, so stepping back to finish one still counts.
    private func startDwell(at newIndex: Int) {
        dwell?.cancel()
        guard stops.indices.contains(newIndex) else { return }
        let stopID = stops[newIndex].id
        dwell = Task { @MainActor in
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(1))
                guard !Task.isCancelled else { return }
                dwellSeconds[stopID, default: 0] += 1
                if dwellSeconds[stopID, default: 0] >= 12, engaged.contains(stopID) {
                    progress.markVisited(stopID)
                    return
                }
            }
        }
    }

    /// The walker did something that only happens while reading.
    private func markEngaged(_ stopID: String) {
        engaged.insert(stopID)
    }

    /// The walker declared this stop done, so credit it outright
    /// rather than waiting on the reading clock.
    private func finish(_ stopID: String) {
        engaged.insert(stopID)
        progress.markVisited(stopID)
    }

    /// The stop currently making sound, wherever the reader has
    /// paged to since starting it.
    private var playingStop: WalkStop? {
        stops.first { audio.isCurrent($0.id) }
    }

    var body: some View {
        if stops.isEmpty {
            // Only reachable if a broken payload ever slips through
            // content validation; never strand the user in a crash.
            Color.clear.onAppear { dismiss() }
        } else {
            tourBody
        }
    }

    private var tourBody: some View {
        ZStack(alignment: .bottom) {
            VStack(spacing: 0) {
                topBar
                if onIntro {
                    IntroPage(goNext: { leaveIntro() })
                        .transition(.opacity)
                } else {
                TabView(selection: $index) {
                    ForEach(Array(stops.enumerated()), id: \.element.id) { i, stop in
                        StopPage(
                            stop: stop,
                            isLast: i == stops.count - 1,
                            // Walking on from the hand-off plate is
                            // the plainest statement there is that
                            // this stop is done.
                            goNext: i < stops.count - 1 ? {
                                finish(stop.id)
                                move(to: i + 1)
                            } : nil,
                            // Stop one steps back onto the intro, so
                            // the essay is a page in the sequence
                            // rather than a one-way door.
                            goPrevious: i > 0 ? { move(to: i - 1) } : { enterIntro() },
                            onTitleHidden: { hidden in
                                // A page laid out at zero size reports
                                // its title hidden, so a neighbour the
                                // walker never opened must not speak.
                                guard i == safeIndex else { return }
                                if hidden {
                                    scrolledPastTitle.insert(stop.id)
                                } else {
                                    scrolledPastTitle.remove(stop.id)
                                }
                            },
                            onScrolled: {
                                guard i == safeIndex else { return }
                                markEngaged(stop.id)
                            },
                            scrollToPlate: i == safeIndex ? openPlate : nil,
                            onPlateShown: { openPlate = nil }
                        )
                        .tag(i)
                    }
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
                .ignoresSafeArea(edges: .bottom)
                }
            }
            .background(RF.cream)

            // The scrim belongs to the screen, not to the chrome
            // stack. Hung off the chrome it stopped wherever that
            // stack happened to end, which left a strip of full
            // strength transcript running under the pills and into
            // the home indicator. Anchored here it fades the text
            // out above the bar and stays solid all the way down.
            // The intro carries its own Next inside the page, so the
            // scrim and the pill row would be fading and floating over
            // nothing.
            if !onIntro {
            bottomScrim

            // The pill row sits centered over the transport bar, the
            // arrows flanking Directions and Map so you can step
            // between stops without scrolling.
            VStack(alignment: .center, spacing: 12) {
                nearbyHint
                HStack(spacing: 10) {
                    arrowPill(forward: false)
                    directionsPill
                    mapPill
                    arrowPill(forward: true)
                }
                // Bound to whatever is actually audible, not to the
                // page you happen to be looking at, so the round
                // button is always a true pause for what you hear.
                TransportBar(playing: playingStop) { id in
                    if let i = stops.firstIndex(where: { $0.id == id }) {
                        move(to: i)
                    }
                }
            }
            .padding(.horizontal, 12)
            .padding(.bottom, 6)
            }
        }
        .background(RF.cream.ignoresSafeArea())
        .onChange(of: index) { _, newIndex in
            guard !onIntro else { return }
            Haptics.tap()
            progress.setLastIndex(newIndex)
            startDwell(at: newIndex)
            offerDetourNotice()
        }
        .onAppear {
            location.requestAndStartIfAuthorized()
            guard !onIntro else { return }
            progress.setLastIndex(index)
            startDwell(at: safeIndex)
            offerDetourNotice()
        }
        .onDisappear {
            dwell?.cancel()
            // GPS belongs to the tour; leaving it must not keep the
            // radio warm for the rest of the app session.
            location.stopUpdates()
        }
        .onChange(of: scenePhase) { _, phase in
            // A phone in a pocket is not reading.
            if phase == .active, !onIntro {
                startDwell(at: safeIndex)
            } else {
                dwell?.cancel()
            }
        }
        .onChange(of: audio.currentTime) { _, time in
            // Twenty seconds of narration is unambiguous intent, and
            // most people never let a file run to its last second.
            guard let id = audio.currentStopID, time >= 20 else { return }
            engaged.insert(id)
            progress.markVisited(id)
        }
        .onChange(of: stops.count) { _, newCount in
            index = min(index, max(0, newCount - 1))
        }
        .sheet(isPresented: $showMap) {
            MapSheetView(currentIndex: index) { tapped in
                index = tapped
                showMap = false
            }
        }
        .alert("This one is an optional detour", isPresented: $showDetourNotice) {
            if let rejoin = nextMainlineIndex {
                Button("Skip to stop \(stops[rejoin].number)") { move(to: rejoin) }
            }
            Button("Keep reading", role: .cancel) {}
        } message: {
            Text(detourNoticeText)
        }
    }

    // MARK: - The detour notice

    /// Written for this moment rather than lifted off the practical
    /// card, which is a reference the walker reads at home. Standing
    /// on a sidewalk they need two facts, the time it costs and the
    /// advice to go in daylight with company.
    private var detourNoticeText: String {
        content.tour.detourNotice
            ?? "This stop sits off the main route and adds real distance. Go in daylight, and bring someone with you if you can. The main walk is complete without it."
    }

    /// The first stop after this one that is back on the main line,
    /// so the alert can offer a way out rather than just a warning.
    private var nextMainlineIndex: Int? {
        guard safeIndex + 1 < stops.count else { return nil }
        return stops[(safeIndex + 1)...].firstIndex { !$0.isDetour }
    }

    /// Fires once per visit to the tour, the first time the walker
    /// actually opens one of the optional stops.
    private func offerDetourNotice() {
        guard !detourNoticeShown, stops.indices.contains(safeIndex),
              stops[safeIndex].isDetour else { return }
        detourNoticeShown = true
        showDetourNotice = true
    }

    // MARK: - Bottom scrim

    /// Cream that starts at nothing, is solid by the time it reaches
    /// the pill row, and stays solid to the bottom edge of the glass.
    /// Two hundred points is enough to swallow three lines of the
    /// transcript on the largest text size we ship.
    private var bottomScrim: some View {
        // The spacer, not the gradient, is what reaches the glass.
        // ignoresSafeArea on a fixed-height gradient only lets it sit
        // in the home-indicator strip, it does not stretch it, so a
        // line of transcript kept showing under the pills.
        VStack(spacing: 0) {
            Spacer(minLength: 0)
            LinearGradient(
                stops: [
                    .init(color: RF.cream.opacity(0), location: 0),
                    .init(color: RF.cream.opacity(0.85), location: 0.42),
                    .init(color: RF.cream, location: 0.62),
                    .init(color: RF.cream, location: 1),
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            .frame(height: 210)
        }
        .frame(maxWidth: .infinity)
        .ignoresSafeArea(edges: .bottom)
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }

    // MARK: - Top bar

    /// True while the current stop's own title is scrolled offscreen.
    private var showPinnedTitle: Bool {
        scrolledPastTitle.contains(stops[safeIndex].id)
    }

    private var topBar: some View {
        // The second row is always there, holding its height. Letting
        // it appear and disappear grew the bar by 26pt and lurched
        // the paragraph being read down the page mid-scroll.
        VStack(spacing: 5) {
            topBarRow
            Text(showPinnedTitle && !onIntro ? stops[safeIndex].title : " ")
                .font(RF.display(17, weight: 600))
                .foregroundStyle(RF.forest)
                .lineLimit(1)
                .truncationMode(.tail)
                .frame(maxWidth: .infinity)
                .frame(height: 22)
                .opacity(showPinnedTitle ? 1 : 0)
                .accessibilityIdentifier("pinned-stop-title")
                .accessibilityHidden(!showPinnedTitle)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(RF.cream)
        .overlay(alignment: .bottom) {
            Rectangle().fill(RF.border).frame(height: 1)
        }
        .clipped()
        .animation(RFMotion.gated(.rfAppear, reduceMotion), value: showPinnedTitle && !onIntro)
    }

    /// "Stop 4 of 16" against the walk proper, and a plain label on
    /// the optional detours, which are not numbered legs of it.
    private var counterLabel: String {
        if onIntro { return "Before you start" }
        let stop = stops[safeIndex]
        if stop.isDetour { return "Optional detour" }
        // The stop's own number, not its place in the mainline. With
        // three detours sitting mid-walk the two diverge, and the
        // number is what the map, the list, and the site all print.
        return "Stop \(stop.number) of \(stops.count)"
    }

    /// How far through the walk the progress capsule reads.
    private var counterFraction: CGFloat {
        if onIntro { return 0 }
        let mainline = stops.filter { !$0.isDetour }
        guard !mainline.isEmpty else { return 0 }
        if stops[safeIndex].isDetour { return 1 }
        let place = mainline.firstIndex(where: { $0.id == stops[safeIndex].id }).map { $0 + 1 } ?? 1
        return CGFloat(place) / CGFloat(mainline.count)
    }

    private var topBarRow: some View {
        HStack(spacing: 12) {
            Button {
                dismiss()
            } label: {
                // No chevron: this is a modal dismissal, not a pop,
                // so promising a back gesture would be a lie.
                Text("Exit")
                    .font(RF.body(16, weight: 500))
                    .foregroundStyle(RF.ink.opacity(0.7))
                    .frame(minWidth: 44, minHeight: 44, alignment: .leading)
                    .contentShape(Rectangle())
            }
            .accessibilityIdentifier("tour-exit")

            Spacer()

            VStack(spacing: 5) {
                Text(counterLabel)
                    .font(RF.body(14, weight: 600))
                    .foregroundStyle(RF.ink.opacity(0.8))
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Capsule().fill(RF.border)
                        Capsule()
                            .fill(RF.rust)
                            .frame(width: geo.size.width * counterFraction)
                    }
                }
                .frame(width: 132, height: 3)
            }

            Spacer()

            ShareLink(item: URL(string: "https://rooted-forward.org/tours")!) {
                HStack(spacing: 5) {
                    Image(systemName: "square.and.arrow.up")
                        .font(.system(size: 13, weight: .medium))
                    Text("Share")
                        .font(RF.body(15, weight: 500))
                }
                .foregroundStyle(RF.ink.opacity(0.8))
                .padding(.horizontal, 12)
                .padding(.vertical, 7)
                .background(.white)
                .overlay(Rectangle().strokeBorder(RF.border, lineWidth: 1))
                // Invisible extension up to the 44pt touch minimum
                .frame(minHeight: 44)
                .contentShape(Rectangle())
            }
        }
    }

    // MARK: - Floating pills

    /// A round paper pill stepping one stop back or forward.
    private func arrowPill(forward: Bool) -> some View {
        let disabled = forward && safeIndex >= stops.count - 1
        return Button {
            if !forward, safeIndex == 0 {
                enterIntro()
            } else {
                move(to: forward ? min(stops.count - 1, safeIndex + 1) : max(0, safeIndex - 1))
            }
        } label: {
            Image(systemName: forward ? "chevron.right" : "chevron.left")
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(RF.ink.opacity(disabled ? 0.3 : 0.75))
                .frame(width: 42, height: 42)
                .background(Circle().fill(RF.paper))
                .overlay(Circle().strokeBorder(RF.ink.opacity(0.22), lineWidth: 1))
                .background(
                    Circle().fill(RF.ink.opacity(0.18)).offset(x: 3, y: 3)
                )
                .frame(minWidth: 44, minHeight: 44)
                .contentShape(Circle())
        }
        .disabled(disabled)
        .accessibilityLabel(
            forward ? "Next stop" : (safeIndex == 0 ? "Back to why this walk" : "Previous stop")
        )
        .accessibilityIdentifier(forward ? "pill-next" : "pill-previous")
    }

    private var directionsPill: some View {
        Link(destination: directionsURL(lat: stops[safeIndex].lat, lng: stops[safeIndex].lng)) {
            HStack(spacing: 7) {
                Image(systemName: "mappin.and.ellipse")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(RF.rust)
                Text("Directions")
                    .font(RF.body(16, weight: 600))
                    .foregroundStyle(RF.ink.opacity(0.85))
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 11)
            .background(Capsule().fill(RF.paper))
            .overlay(Capsule().strokeBorder(RF.ink.opacity(0.22), lineWidth: 1))
            .background(
                Capsule().fill(RF.ink.opacity(0.18)).offset(x: 3, y: 3)
            )
        }
        .accessibilityLabel("Walking directions to \(stops[safeIndex].title)")
    }

    private var mapPill: some View {
        Button {
            showMap = true
        } label: {
            HStack(spacing: 7) {
                Image(systemName: "map")
                    .font(.system(size: 14, weight: .semibold))
                Text("Map")
                    .font(RF.body(16, weight: 600))
            }
            .foregroundStyle(RF.cream)
            .padding(.horizontal, 18)
            .padding(.vertical, 11)
            .background(Capsule().fill(RF.forest))
            .background(
                Capsule().fill(RF.ink.opacity(0.25)).offset(x: 3, y: 3)
            )
        }
        .accessibilityIdentifier("tour-map")
    }

    // MARK: - Nearby hint

    @ViewBuilder
    private var nearbyHint: some View {
        if let near = location.nearestStop(in: content.tour),
           near.meters < 60,
           near.stop.id != stops[safeIndex].id {
            Button {
                if let i = stops.firstIndex(where: { $0.id == near.stop.id }) {
                    move(to: i)
                }
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: "location.fill")
                        .font(.system(size: 11, weight: .semibold))
                    Text("You are near stop \(near.stop.number). Jump there")
                        .font(RF.body(13, weight: 600))
                }
                .foregroundStyle(RF.forest)
                .padding(.horizontal, 14)
                .padding(.vertical, 9)
                .background(Capsule().fill(.white))
                .overlay(Capsule().strokeBorder(RF.forest.opacity(0.35), lineWidth: 1))
                .frame(minHeight: 44)
                .contentShape(Rectangle())
            }
            .frame(maxWidth: .infinity, alignment: .center)
        }
    }

}

/// The paper transport bar. Isolated so the audio engine's frequent
/// progress updates re-render only this view, not the whole tour.
struct TransportBar: View {
    @EnvironmentObject private var audio: AudioEngine
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    /// Whatever is making sound right now, or nothing.
    let playing: WalkStop?
    /// Taps the title to page back to the stop being narrated.
    let goToPlaying: (String) -> Void

    var body: some View {
        // Hidden until narration first starts, like a mini player;
        // the stop pages carry their own play control before that.
        ZStack {
            if let playing, audio.currentStopID != nil {
                bar(playing)
                    .transition(
                        reduceMotion
                            ? .opacity
                            : .move(edge: .bottom).combined(with: .opacity)
                    )
            }
        }
        .animation(RFMotion.gated(.rfMove, reduceMotion), value: audio.currentStopID != nil)
    }

    private func bar(_ stop: WalkStop) -> some View {
        let fraction = audio.duration > 0
            ? min(1, audio.currentTime / audio.duration) : 0

        return VStack(spacing: 0) {
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Rectangle().fill(RF.border.opacity(0.6))
                    Rectangle()
                        .fill(RF.rust)
                        .frame(width: geo.size.width * fraction)
                }
            }
            .frame(height: 2)

            HStack(spacing: 8) {
                Button {
                    goToPlaying(stop.id)
                } label: {
                    HStack(spacing: 7) {
                        Text("\(stop.number). \(stop.title)")
                            .font(RF.body(15, weight: 600))
                            .foregroundStyle(RF.ink)
                            .lineLimit(1)
                        Image(systemName: "chevron.up")
                            .font(.system(size: 10, weight: .semibold))
                            .foregroundStyle(RF.warmGrayDark)
                        Spacer(minLength: 4)
                    }
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Go to the stop being narrated, \(stop.title)")

                PlayButton(stop: stop, size: 46)
            }
            .padding(.leading, 14)
            .padding(.trailing, 6)
            .padding(.vertical, 5)
        }
        .background(RF.paper)
        .overlay(Rectangle().strokeBorder(RF.ink.opacity(0.22), lineWidth: 1))
        // 5pt, so the light falls the same way it does on every plate
        .background(Rectangle().fill(RF.forest.opacity(0.14)).offset(x: 5, y: 5))
    }
}

/// The rust play/pause circle bound to one stop's narration.
struct PlayButton: View {
    @EnvironmentObject private var content: ContentStore
    @EnvironmentObject private var audio: AudioEngine
    let stop: WalkStop
    var size: CGFloat = 46

    var body: some View {
        let playingThis = audio.isCurrent(stop.id) && audio.isPlaying
        Button {
            Haptics.press()
            // Play immediately; the lock-screen artwork is cosmetic
            // and must never gate narration behind a network fetch.
            audio.toggle(stop: stop, url: content.mediaURL(for: stop.audioSrc), artwork: nil)
            Task {
                let thumbPath = ContentStore.thumbPath(
                    for: (stop.nowImage ?? stop.images.first)?.src ?? ""
                )
                if let artwork = await content.image(for: thumbPath) {
                    audio.updateArtwork(artwork, for: stop.id)
                }
            }
        } label: {
            Image(systemName: playingThis ? "pause.fill" : "play.fill")
                .font(.system(size: size * 0.36, weight: .bold))
                .foregroundStyle(.white)
                .offset(x: playingThis ? 0 : size * 0.03)
                .frame(width: size, height: size)
                .background(Circle().fill(RF.rust))
        }
        .accessibilityLabel(playingThis ? "Pause stop \(stop.number)" : "Play stop \(stop.number), \(stop.title)")
        .accessibilityIdentifier("play-stop-\(stop.number)")
    }
}

extension LocationService {
    /// Starts updates only when permission already exists; the tour
    /// never prompts on its own, only the map's Find me button does.
    func requestAndStartIfAuthorized() {
        if status == .authorizedWhenInUse || status == .authorizedAlways {
            start()
        }
    }
}
