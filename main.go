package main

import (
	"fmt"
	"log"
	"net"
	"os"
	"os/exec"
	"syscall"
)

/**
+-------------------------------------+
| HOW TO COMPILE AND BUILD EXECUTABLE |
+-------------------------------------+
go build -ldflags="-s -w -H windowsgui" -o get-ip.exe main.go

Flags explained:
	By default, Go includes debugging information which makes the file larger (usually around 2MB). If you want a smaller, cleaner executable, use "ldflags" to strip that extra data:
		1) -s: Removes the symbol table.
		2) -w: Removes DWARF debugging information.

	If you eventually build a GUI application or a background tool and you don't want a black terminal window to pop up when you run the .exe, add this flag:
		3) -H="windowsgui"
*/

func GetLocalIP() string {
	// We use a dialer to see which local address the OS picks to reach an external target
	// 8.8.8.8:80 does not actually send a packet; it just opens the connection locally
	/**
	This creates a UDP socket.
	Because UDP is connectionless, calling Dial doesn't actually handshake with Google's servers.
	It simply asks the Windows routing table: "If I wanted to send a packet to 8.8.8.8, which local IP should I use as the source?"
	This approach is preferred over net.InterfaceAddrs() because it ignores inactive virtual interfaces
	(like those from Docker or VMware) and focuses on the one currently providing internet/network access.
	Prioritizes Connectivity: If you have both Wi-Fi and Ethernet plugged in, it will return the one the laptop is actually using to talk to the world.
	*/
	conn, err := net.Dial("udp", "8.8.8.8:80")
	if err != nil {
		log.Fatal(err)
	}
	defer conn.Close()

	/**
	This retrieves the local address that was assigned to that specific socket by the OS.
	Type Assertion: Since LocalAddr() returns a generic Addr interface, we use .(*net.UDPAddr) to access the specific IP field.
	*/
	localAddr := conn.LocalAddr().(*net.UDPAddr)

	return localAddr.IP.String()
}

func main() {
	// Define the file paths
	certFile := `C:\Workspaces\Personal\mkcert\localhost-cert.pem`
	keyFile := `C:\Workspaces\Personal\mkcert\localhost-key.pem`
	bundleFile := `C:\Workspaces\Personal\mkcert\localhost-bundle.pem`

	localIp := GetLocalIP()
	fmt.Printf("%s\n", localIp)

	// 1. Define the command and its arguments separately
	args := []string{
		`C:\Path\To\Your\mkcert.exe`,
		"-key-file", keyFile,
		"-cert-file", certFile,
		"localhost",
		localIp,
	}

	// 2. Prepare the command
	// https://stackoverflow.com/questions/42500570/how-to-hide-command-prompt-window-when-using-exec-in-golang
	cmd_path := "C:\\Windows\\system32\\cmd.exe"
	cmd_instance := exec.Command(cmd_path, args...)
	cmd_instance.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}

	// 3. Execute and capture the combined output (stdout and stderr)
	output, err := cmd_instance.CombinedOutput()
	if err != nil {
		log.Fatalf("Command failed with error: %v\nOutput: %s", err, string(output))
	}

	// Read the certificate file
	certData, err := os.ReadFile(certFile)
	if err != nil {
		log.Fatalf("Failed to read cert file: %v", err)
	}

	// Read the key file
	keyData, err := os.ReadFile(keyFile)
	if err != nil {
		log.Fatalf("Failed to read key file: %v", err)
	}

	// Combine the data
	// We add a newline between them just in case the first file doesn't end with one
	combinedData := append(certData, '\n')
	combinedData = append(combinedData, keyData...)

	// Write the new bundle file
	// 0644 provides standard read/write permissions
	err = os.WriteFile(bundleFile, combinedData, 0644)
	if err != nil {
		log.Fatalf("Failed to write bundle file: %v", err)
	}

	fmt.Println("Successfully created localhost-bundle.pem")
}
