package main

import (
	"context"
	"flag"
	"net/http"
	"os"
	"os/signal"
	"time"

	"github.com/nus-utils/nus-peer-review/admin"
	"github.com/nus-utils/nus-peer-review/db"
	"github.com/nus-utils/nus-peer-review/loggers"
	"github.com/nus-utils/nus-peer-review/module"
	"github.com/nus-utils/nus-peer-review/staff"
	"github.com/nus-utils/nus-peer-review/student"
	"github.com/nus-utils/nus-peer-review/utils"
	"gorm.io/gorm"

	"github.com/gorilla/mux"
)

func main() {
	loggers.InitLoggers(os.Getenv("RUN_ENV"))
	db := db.InitDB(os.Getenv("DATABASE_URL"))
	InitServer(db)
}

func healthCheck(w http.ResponseWriter, r *http.Request) {
	utils.HandleResponseWithObject(w, "Server is healthy", http.StatusOK)
}

func InitServer(pool *gorm.DB) {
	var wait time.Duration
	flag.DurationVar(
		&wait,
		"graceful-timeout",
		time.Second*15,
		"the duration for which the server gracefully wait for existing connections to finish - e.g. 15s or 1m",
	)
	flag.Parse()

	loggers.InfoLogger.Println("Starting server")
	route := mux.NewRouter()

	studentRoute := student.StudentRoute{
		DB: pool,
	}

	staffRoute := staff.StaffRoute{
		DB: pool,
	}

	adminRoute := admin.AdminRoute{
		DB: pool,
	}

	moduleRoute := module.ModuleRoute{
		DB: pool,
	}

	studentRoute.CreateRouters(route.PathPrefix("/student").Subrouter())
	staffRoute.CreateRouters(route.PathPrefix("/staff").Subrouter())
	adminRoute.CreateRouters(route.PathPrefix("/admin").Subrouter())
	moduleRoute.GetModulesRoute(route.PathPrefix("/module").Subrouter())
	moduleRoute.GetEnrollmentsRoute(route.PathPrefix("/module/enroll").Subrouter())
	moduleRoute.GetSupervisionsRoute(route.PathPrefix("/module/supervise").Subrouter())
	route.HandleFunc("/health", healthCheck).Methods(http.MethodGet)

	srv := &http.Server{
		Addr:         ":5000",
		Handler:      route,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		ErrorLog:     loggers.ErrorLogger,
	}

	go func() {
		loggers.ErrorLogger.Println(srv.ListenAndServe())
	}()

	c := make(chan os.Signal, 1)
	// We'll accept graceful shutdowns when quit via SIGINT (Ctrl+C)
	// SIGKILL, SIGQUIT or SIGTERM (Ctrl+/) will not be caught.
	signal.Notify(c, os.Interrupt)

	// Block until we receive our signal.
	<-c

	// Immediately release DB connections
	db.CloseDB(pool)

	// Create a deadline to wait for.
	ctx, cancel := context.WithTimeout(context.Background(), wait)
	defer cancel()
	// Doesn't block if no connections, but will otherwise wait
	// until the timeout deadline.
	srv.Shutdown(ctx)
	// TODO: you could run srv.Shutdown in a goroutine and block on
	// <-ctx.Done() if your application should wait for other services
	// to finalize based on context cancellation.
	loggers.InfoLogger.Println("shutting down")
}
