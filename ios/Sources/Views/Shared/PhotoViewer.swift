import SwiftUI

// ------------------------------------------------------------------
// Full-screen photograph room: ink backdrop, pinch to zoom into the
// archival detail, caption and credit set like a wall label.
// ------------------------------------------------------------------

struct PhotoViewer: View {
    @EnvironmentObject private var content: ContentStore
    @Environment(\.dismiss) private var dismiss
    let image: WalkImage

    @State private var loaded: UIImage?
    @State private var failed = false

    var body: some View {
        ZStack(alignment: .topTrailing) {
            RF.ink.ignoresSafeArea()

            if let loaded {
                ZoomPanContainer(
                    contentAspect: loaded.size.width / max(loaded.size.height, 1)
                ) {
                    Image(uiImage: loaded)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .accessibilityLabel(image.alt)
                        .accessibilityAddTraits(.isImage)
                }
                .ignoresSafeArea()
            } else if failed {
                VStack(spacing: 14) {
                    Text("The photograph did not load. Check your connection.")
                        .font(RF.body(15))
                        .foregroundStyle(RF.cream.opacity(0.8))
                        .multilineTextAlignment(.center)
                    Button {
                        failed = false
                        Task { await load() }
                    } label: {
                        Text("Try again")
                            .font(RF.body(15, weight: 600))
                            .foregroundStyle(RF.cream)
                            .padding(.horizontal, 18)
                            .padding(.vertical, 9)
                            .overlay(Capsule().strokeBorder(RF.cream.opacity(0.4), lineWidth: 1))
                            .frame(minHeight: 44)
                            .contentShape(Rectangle())
                    }
                }
                .padding(32)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                ProgressView()
                    .tint(RF.cream)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            }

            Button {
                dismiss()
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(RF.cream)
                    .frame(width: 40, height: 40)
                    .background(Circle().fill(.white.opacity(0.12)))
                    .frame(width: 44, height: 44)
                    .contentShape(Circle())
            }
            .padding(.trailing, 16)
            .padding(.top, 8)
            .accessibilityLabel("Close photograph")
            .accessibilityIdentifier("photo-close")
        }
        .overlay(alignment: .bottom) {
            VStack(alignment: .leading, spacing: 6) {
                if let label = image.label {
                    Text(label)
                        .font(RF.display(16, weight: 400, italic: true))
                        .foregroundStyle(RF.cream)
                }
                Text(image.credit)
                    .font(RF.body(12.5))
                    .foregroundStyle(RF.cream.opacity(0.65))
                    .fixedSize(horizontal: false, vertical: true)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(16)
            .background(
                LinearGradient(
                    colors: [.clear, RF.ink.opacity(0.85)],
                    startPoint: .top, endPoint: .bottom
                )
                .ignoresSafeArea(edges: .bottom)
            )
        }
        .task {
            await load()
        }
        .statusBarHidden()
    }

    private func load() async {
        loaded = await content.image(for: image.src)
        failed = loaded == nil
    }
}
