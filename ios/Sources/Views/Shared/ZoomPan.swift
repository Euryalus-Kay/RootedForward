import SwiftUI

// ------------------------------------------------------------------
// A reusable pinch-zoom and pan container: pinch 1x..maxScale,
// two-finger or one-finger pan while zoomed, double-tap to zoom in
// and back out, offsets clamped so the content never drifts off
// screen. Used by the full-screen map explorer and the photograph
// viewer.
// ------------------------------------------------------------------

struct ZoomPanContainer<Content: View>: View {
    /// Content width divided by height, used to fit it in the frame.
    let contentAspect: CGFloat
    var maxScale: CGFloat = 5
    var doubleTapScale: CGFloat = 2.4
    @ViewBuilder let content: () -> Content

    @State private var steadyScale: CGFloat = 1
    @State private var steadyOffset: CGSize = .zero
    @GestureState private var pinchScale: CGFloat = 1
    @GestureState private var dragOffset: CGSize = .zero

    var body: some View {
        GeometryReader { geo in
            let fitted = fittedSize(in: geo.size)
            let scale = clampScale(steadyScale * pinchScale)
            let offset = clampOffset(
                CGSize(
                    width: steadyOffset.width + dragOffset.width,
                    height: steadyOffset.height + dragOffset.height
                ),
                scale: scale, fitted: fitted, container: geo.size
            )

            content()
                .frame(width: fitted.width, height: fitted.height)
                .scaleEffect(scale)
                .offset(offset)
                .frame(width: geo.size.width, height: geo.size.height)
                .contentShape(Rectangle())
                .gesture(
                    MagnificationGesture()
                        .updating($pinchScale) { value, state, _ in
                            state = value
                        }
                        .onEnded { value in
                            steadyScale = clampScale(steadyScale * value)
                            steadyOffset = clampOffset(steadyOffset, scale: steadyScale, fitted: fitted, container: geo.size)
                        }
                )
                .simultaneousGesture(
                    DragGesture(minimumDistance: 10)
                        .updating($dragOffset) { value, state, _ in
                            state = value.translation
                        }
                        .onEnded { value in
                            steadyOffset = clampOffset(
                                CGSize(
                                    width: steadyOffset.width + value.translation.width,
                                    height: steadyOffset.height + value.translation.height
                                ),
                                scale: steadyScale, fitted: fitted, container: geo.size
                            )
                        }
                )
                .onTapGesture(count: 2) { location in
                    Haptics.tap()
                    withAnimation(.spring(duration: 0.35)) {
                        if steadyScale > 1.01 {
                            steadyScale = 1
                            steadyOffset = .zero
                        } else {
                            steadyScale = doubleTapScale
                            // zoom toward the tapped point
                            let center = CGPoint(x: geo.size.width / 2, y: geo.size.height / 2)
                            steadyOffset = clampOffset(
                                CGSize(
                                    width: (center.x - location.x) * doubleTapScale,
                                    height: (center.y - location.y) * doubleTapScale
                                ),
                                scale: doubleTapScale, fitted: fitted, container: geo.size
                            )
                        }
                    }
                }
                .animation(.interactiveSpring(response: 0.28), value: steadyScale)
        }
    }

    private func fittedSize(in container: CGSize) -> CGSize {
        guard container.width > 0, container.height > 0 else { return container }
        let containerAspect = container.width / container.height
        if contentAspect > containerAspect {
            return CGSize(width: container.width, height: container.width / contentAspect)
        }
        return CGSize(width: container.height * contentAspect, height: container.height)
    }

    private func clampScale(_ value: CGFloat) -> CGFloat {
        min(max(value, 1), maxScale)
    }

    private func clampOffset(_ value: CGSize, scale: CGFloat, fitted: CGSize, container: CGSize) -> CGSize {
        let maxX = max(0, (fitted.width * scale - container.width) / 2 + 40)
        let maxY = max(0, (fitted.height * scale - container.height) / 2 + 40)
        return CGSize(
            width: min(max(value.width, -maxX), maxX),
            height: min(max(value.height, -maxY), maxY)
        )
    }
}
